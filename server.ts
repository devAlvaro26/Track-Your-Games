import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

let cachedTwitchToken: { token: string; expiresAt: number } | null = null;

/**
 * Retrieves Twitch OAuth App Access Token required for IGDB API v4 calls.
 */
async function getTwitchToken(lang: string = "en"): Promise<{ token: string | null; error?: string }> {
  const clientId = (process.env.TWITCH_CLIENT_ID || process.env.IGDB_CLIENT_ID || "").trim();
  const clientSecret = (process.env.TWITCH_CLIENT_SECRET || process.env.IGDB_CLIENT_SECRET || "").trim();
  const isEs = lang === "es";

  // Guard against missing, empty or placeholder credentials
  if (!clientId || !clientSecret) {
    return {
      token: null,
      error: isEs
        ? "Faltan TWITCH_CLIENT_ID o TWITCH_CLIENT_SECRET en el archivo .env."
        : "TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET missing from .env file.",
    };
  }

  if (cachedTwitchToken && cachedTwitchToken.expiresAt > Date.now() + 60000) {
    return { token: cachedTwitchToken.token };
  }

  try {
    const res = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      let msg = errText;
      try {
        const json = JSON.parse(errText);
        msg = json.message || errText;
      } catch (e) { }
      console.warn("Twitch OAuth token request status", res.status, ":", msg);
      return {
        token: null,
        error: isEs
          ? `Error de autenticación con Twitch (HTTP ${res.status}): ${msg}`
          : `Twitch authentication error (HTTP ${res.status}): ${msg}`,
      };
    }

    const data = await res.json();
    cachedTwitchToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
    };

    return { token: cachedTwitchToken.token };
  } catch (err: any) {
    console.warn("Error fetching Twitch access token:", err);
    return {
      token: null,
      error: isEs
        ? `Error de conexión con la API de Twitch: ${err.message || "Desconocido"}`
        : `Twitch API connection error: ${err.message || "Unknown"}`,
    };
  }
}

/**
 * Formats IGDB image_id or raw URL into a high-resolution cover image URL (t_cover_big_2x)
 */
function formatIgdbCoverUrl(raw: any): string | undefined {
  if (!raw) return undefined;

  if (typeof raw === "string") {
    if (raw.startsWith("http") || raw.startsWith("//")) {
      const url = raw.startsWith("//") ? `https:${raw}` : raw;
      return url.replace("/t_thumb/", "/t_cover_big_2x/");
    }
    return `https://images.igdb.com/igdb/image/upload/t_cover_big_2x/${raw}.jpg`;
  }

  if (raw.image_id) {
    return `https://images.igdb.com/igdb/image/upload/t_cover_big_2x/${raw.image_id}.jpg`;
  }

  if (raw.url) {
    const url = raw.url.startsWith("//") ? `https:${raw.url}` : raw.url;
    return url.replace("/t_thumb/", "/t_cover_big_2x/");
  }

  return undefined;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Check IGDB configuration status
  app.get("/api/igdb/status", async (req, res) => {
    const lang = (req.query.lang as string) || "en";
    const isEs = lang === "es";
    const clientId = (process.env.TWITCH_CLIENT_ID || process.env.IGDB_CLIENT_ID || "").trim();
    const clientSecret = (process.env.TWITCH_CLIENT_SECRET || process.env.IGDB_CLIENT_SECRET || "").trim();

    if (!clientId || !clientSecret) {
      return res.json({
        configured: false,
        message: isEs
          ? "Configura TWITCH_CLIENT_ID y TWITCH_CLIENT_SECRET en el archivo .env para habilitar IGDB."
          : "Configure TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET in .env file to enable IGDB.",
      });
    }

    const auth = await getTwitchToken(lang);
    if (!auth.token) {
      return res.json({
        configured: false,
        error: auth.error || (isEs ? "No se pudo obtener el token de Twitch OAuth." : "Could not obtain Twitch OAuth token."),
      });
    }

    res.json({
      configured: true,
      message: isEs
        ? "Conexión con la API v4 de IGDB verificada y activa."
        : "IGDB API v4 connection verified and active.",
    });
  });

  // Search games in IGDB API v4
  app.post("/api/igdb/search", async (req, res) => {
    const lang = req.body?.lang || "en";
    const isEs = lang === "es";
    try {
      const { query, limit = 10 } = req.body;

      if (!query || typeof query !== "string" || !query.trim()) {
        return res.status(400).json({
          error: isEs ? "El término de búsqueda es requerido." : "Search term is required.",
        });
      }

      const clientId = (process.env.TWITCH_CLIENT_ID || process.env.IGDB_CLIENT_ID || "").trim();
      const auth = await getTwitchToken(lang);

      if (!clientId || !auth.token) {
        return res.status(401).json({
          games: [],
          configured: false,
          error: auth.error || (isEs ? "No se ha configurado la API de IGDB o las credenciales no son válidas." : "IGDB API is not configured or credentials are invalid."),
        });
      }

      // Direct IGDB v4 Search
      const sanitizedQuery = query.trim().replace(/"/g, '\\"');
      const igdbBody = `search "${sanitizedQuery}"; fields name, summary, storyline, first_release_date, genres.name, platforms.name, cover.url, cover.image_id, total_rating, rating, url; limit ${limit};`;

      const igdbRes = await fetch("https://api.igdb.com/v4/games", {
        method: "POST",
        headers: {
          "Client-ID": clientId,
          "Authorization": `Bearer ${auth.token}`,
          "Content-Type": "text/plain",
        },
        body: igdbBody,
      });

      if (!igdbRes.ok) {
        const errBody = await igdbRes.text();
        console.warn("IGDB search call returned status:", igdbRes.status, errBody);
        return res.status(igdbRes.status).json({
          games: [],
          configured: true,
          error: isEs
            ? `Error de la API de IGDB (HTTP ${igdbRes.status}): ${errBody || "Error al realizar la consulta"}`
            : `IGDB API error (HTTP ${igdbRes.status}): ${errBody || "Query error"}`,
        });
      }

      const rawGames = await igdbRes.json();
      const games = rawGames.map((g: any) => ({
        id: g.id,
        name: g.name,
        summary: g.summary || g.storyline || "",
        firstReleaseDate: g.first_release_date
          ? new Date(g.first_release_date * 1000).toISOString().split("T")[0]
          : "",
        genres: g.genres ? g.genres.map((gen: any) => gen.name) : [],
        platforms: g.platforms ? g.platforms.map((p: any) => p.name) : [],
        coverUrl: formatIgdbCoverUrl(g.cover),
        rating: g.total_rating || g.rating ? Math.round(g.total_rating || g.rating) : undefined,
        url: g.url || `https://www.igdb.com/games/${g.id}`,
      }));

      return res.json({
        games,
        count: games.length,
        source: "igdb",
        configured: true,
        message: games.length > 0
          ? (isEs
            ? `Búsqueda completada. Se obtuvieron ${games.length} resultado(s) de IGDB.`
            : `Search completed. Obtained ${games.length} result(s) from IGDB.`)
          : (isEs
            ? `Respuesta recibida de IGDB: 0 juegos encontrados para "${query}".`
            : `Response received from IGDB: 0 games found for "${query}".`),
      });

    } catch (error: any) {
      console.error("Error en /api/igdb/search:", error);
      res.status(500).json({
        error: error.message || (lang === "es" ? "Error interno al buscar juegos en IGDB." : "Internal error searching games in IGDB."),
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
