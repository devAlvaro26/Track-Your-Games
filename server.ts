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

    const responseText = await res.text();

    if (!res.ok) {
      let msg = responseText;
      try {
        const json = JSON.parse(responseText);
        msg = json.message || json.error_description || responseText;
      } catch (e) {
        msg = isEs ? "Error al obtener el token de Twitch OAuth" : "Error getting Twitch OAuth token";
      }
      console.warn("Twitch OAuth token request status", res.status, ":", msg);
      return {
        token: null,
        error: isEs
          ? `Error de autenticación con Twitch (HTTP ${res.status}): ${msg}`
          : `Twitch authentication error (HTTP ${res.status}): ${msg}`,
      };
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return {
        token: null,
        error: isEs
          ? "No se pudo interpretar la respuesta del servidor de Twitch (formato inválido)."
          : "Could not parse response from Twitch server (invalid format).",
      };
    }

    if (!data.access_token) {
      return {
        token: null,
        error: isEs
          ? "No se recibió un token de acceso válido de Twitch."
          : "No valid access token returned from Twitch.",
      };
    }

    cachedTwitchToken = {
      token: data.access_token,
      expiresAt: Date.now() + ((data.expires_in || 3600) * 1000),
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

export const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Check IGDB configuration status
app.get("/api/igdb/status", async (req: express.Request, res: express.Response) => {
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
app.post("/api/igdb/search", async (req: express.Request, res: express.Response) => {
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

    const responseText = await igdbRes.text();

    if (!igdbRes.ok) {
      let msg = responseText;
      try {
        const json = JSON.parse(responseText);
        if (Array.isArray(json) && json[0]?.title) {
          msg = json[0].title;
        } else if (json.message) {
          msg = json.message;
        } else if (typeof json === "string") {
          msg = json;
        }
      } catch (e) {
        if (responseText.includes("<html") || responseText.includes("The page") || responseText.includes("<!DOCTYPE")) {
          msg = isEs
            ? "La API de IGDB devolvió una página de error HTML. Por favor comprueba que las credenciales de Twitch/IGDB sean correctas."
            : "IGDB API returned an HTML error page. Please verify your Twitch/IGDB credentials.";
        }
      }
      console.warn("IGDB search call returned status:", igdbRes.status, msg);
      return res.status(igdbRes.status >= 400 && igdbRes.status < 600 ? igdbRes.status : 500).json({
        games: [],
        configured: true,
        error: isEs
          ? `Error de la API de IGDB (HTTP ${igdbRes.status}): ${msg}`
          : `IGDB API error (HTTP ${igdbRes.status}): ${msg}`,
      });
    }

    let rawGames: any[];
    try {
      rawGames = JSON.parse(responseText);
    } catch (parseErr) {
      console.warn("Failed to parse IGDB response as JSON:", responseText.slice(0, 150));
      let errorMsg = isEs
        ? "No se pudo procesar la respuesta de IGDB (formato no válido)."
        : "Unable to parse response from IGDB (invalid format).";

      if (responseText.includes("<html") || responseText.includes("The page") || responseText.includes("<!DOCTYPE")) {
        errorMsg = isEs
          ? "La API de IGDB devolvió una página HTML en lugar de datos JSON. Comprueba tus claves en .env."
          : "IGDB API returned an HTML page instead of JSON data. Please check your credentials in .env.";
      }

      return res.status(502).json({
        games: [],
        configured: true,
        error: errorMsg,
      });
    }

    if (!Array.isArray(rawGames)) {
      return res.json({
        games: [],
        count: 0,
        source: "igdb",
        configured: true,
        message: isEs
          ? "Estructura de respuesta inesperada de IGDB."
          : "Unexpected response structure from IGDB.",
      });
    }

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
      games: [],
      error: isEs
        ? `Error interno al buscar juegos en IGDB: ${error.message || "Desconocido"}`
        : `Internal error searching games in IGDB: ${error.message || "Unknown"}`,
    });
  }
});

async function startServer() {
  if (process.env.VERCEL) return;

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

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

export default app;
