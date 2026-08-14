import { Language } from "./types";

/**
 * Tabular translation system where each text key holds translations for all supported languages side-by-side.
 * This tabular layout allows developers to view, edit, and maintain translations in parallel,
 * ensuring high efficiency, scalability, and zero missing key discrepancies across languages.
 */
export const translationTable = {
  // --- HEADER & APP BRANDING ---
  appTitle: {
    es: "Mi biblioteca",
    en: "My Library",
  },
  welcomeUser: {
    es: "Colección de",
    en: "Collection of",
  },
  addGame: {
    es: "Añadir Juego",
    en: "Add Game",
  },
  settings: {
    es: "Ajustes",
    en: "Settings",
  },
  navigation: {
    es: "Navegación",
    en: "Navigation",
  },
  homeLibrary: {
    es: "Inicio / Biblioteca",
    en: "Home / Library",
  },
  collections: {
    es: "COLECCIONES",
    en: "COLLECTIONS",
  },
  statistics: {
    es: "Estadísticas",
    en: "Statistics",
  },
  lightTheme: {
    es: "Claro",
    en: "Light",
  },
  darkTheme: {
    es: "Oscuro",
    en: "Dark",
  },

  // --- AUTHENTICATION ---
  loginTitle: {
    es: "Iniciar Sesión",
    en: "Sign In",
  },
  signupTitle: {
    es: "Crear Cuenta",
    en: "Create Account",
  },
  authSubtitle: {
    es: "Conéctate para guardar y sincronizar tu colección en la nube con tu base de datos",
    en: "Connect to save and sync your collection in the cloud with your database",
  },
  emailLabel: {
    es: "Correo electrónico",
    en: "Email address",
  },
  passwordLabel: {
    es: "Contraseña",
    en: "Password",
  },
  confirmPasswordLabel: {
    es: "Confirmar Contraseña",
    en: "Confirm Password",
  },
  alreadyHaveAccount: {
    es: "¿Ya tienes una cuenta?",
    en: "Already have an account?",
  },
  dontHaveAccount: {
    es: "¿No tienes cuenta?",
    en: "Don't have an account?",
  },
  loginBtn: {
    es: "Iniciar Sesión",
    en: "Sign In",
  },
  signupBtn: {
    es: "Registrarse",
    en: "Sign Up",
  },
  logoutBtn: {
    es: "Cerrar Sesión",
    en: "Sign Out",
  },
  loginSuccess: {
    es: "¡Sesión iniciada correctamente!",
    en: "Logged in successfully!",
  },
  signupSuccess: {
    es: "¡Cuenta registrada correctamente!",
    en: "Account registered successfully!",
  },
  logoutSuccess: {
    es: "Sesión cerrada.",
    en: "Logged out.",
  },
  guestMode: {
    es: "Modo Local (Sin Conexión)",
    en: "Local Mode (No Connection)",
  },
  statusOnline: {
    es: "En línea",
    en: "Online",
  },
  statusOffline: {
    es: "Desconectado",
    en: "Offline",
  },
  sessionStatus: {
    es: "Estado de la sesión",
    en: "Session status",
  },
  databaseNotConnected: {
    es: "Base de datos no configurada",
    en: "Database not configured",
  },
  databaseConnected: {
    es: "Base de datos conectada",
    en: "Database connected",
  },
  databaseSetupGuide: {
    es: "Ver Instrucciones de Base de Datos",
    en: "View Database Instructions",
  },
  syncingData: {
    es: "Cargando datos...",
    en: "Loading data...",
  },
  userProfile: {
    es: "Perfil de Usuario",
    en: "User Profile",
  },
  profileOf: {
    es: "Perfil de {name}",
    en: "{name}'s Profile",
  },
  profile: {
    es: "Perfil",
    en: "Profile",
  },
  cloudSynced: {
    es: "Datos guardados en la nube",
    en: "Data saved in cloud",
  },
  localStorageNotice: {
    es: "Guardando temporalmente en el navegador",
    en: "Saving temporarily in browser",
  },
  databaseWarningDesc: {
    es: "Para sincronizar usuarios y juegos con tu base de datos, debes configurar las claves de la API.",
    en: "To sync users and games with your database, you must set up the API keys.",
  },
  databaseNotConfiguredErr: {
    es: "La base de datos no está configurada aún con las variables necesarias de entorno.",
    en: "The database is not configured yet with the required environment variables.",
  },
  fillEmailPasswordErr: {
    es: "Por favor rellena el email y la contraseña.",
    en: "Please fill in email and password.",
  },
  usernameRequiredErr: {
    es: "El nombre de usuario es obligatorio para el registro.",
    en: "Username is required for sign up.",
  },
  authDefaultErr: {
    es: "Error al autenticar.",
    en: "Authentication error.",
  },
  userAlreadyRegisteredErr: {
    es: "Este correo electrónico ya está registrado. Por favor, inicia sesión.",
    en: "This email address is already registered. Please sign in.",
  },
  invalidCredentialsErr: {
    es: "Correo electrónico o contraseña incorrectos.",
    en: "Invalid email or password.",
  },
  passwordMinLengthErr: {
    es: "La contraseña debe tener al menos 6 caracteres.",
    en: "Password must be at least 6 characters.",
  },
  switchToLoginBtn: {
    es: "Ir a Iniciar Sesión",
    en: "Switch to Sign In",
  },
  signingIn: {
    es: "Iniciando...",
    en: "Signing in...",
  },
  signingUp: {
    es: "Registrando...",
    en: "Signing up...",
  },

  // --- SETTINGS MODAL ---
  settingsTitle: {
    es: "Ajustes de la Aplicación",
    en: "Application Settings",
  },
  settingsSubtitle: {
    es: "Personaliza el tema, idioma y tu perfil de coleccionista",
    en: "Customize theme, language, and your collector profile",
  },
  themeLabel: {
    es: "Tema de la aplicación",
    en: "App Theme",
  },
  themeDark: {
    es: "Modo Oscuro",
    en: "Dark Mode",
  },
  themeLight: {
    es: "Modo Claro",
    en: "Light Mode",
  },
  languageLabel: {
    es: "Idioma de la interfaz",
    en: "Interface Language",
  },
  languageEs: {
    es: "Español (Spanish)",
    en: "Spanish (Español)",
  },
  languageEn: {
    es: "English (Inglés)",
    en: "English (English)",
  },
  usernameLabel: {
    es: "Nombre de usuario",
    en: "Username",
  },
  usernamePlaceholder: {
    es: "Tu apodo o nombre...",
    en: "Your gamer tag or name...",
  },
  avatarLabel: {
    es: "Imagen de perfil",
    en: "Profile Picture",
  },
  uploadAvatar: {
    es: "Subir Imagen",
    en: "Upload Image",
  },
  changeAvatar: {
    es: "Cambiar Foto",
    en: "Change Photo",
  },
  removeAvatar: {
    es: "Quitar Foto",
    en: "Remove Photo",
  },
  avatarUrlPlaceholder: {
    es: "O pega la URL de la imagen...",
    en: "Or paste an image URL...",
  },
  avatarUploadHint: {
    es: "Haz clic o arrastra una imagen (PNG, JPG o WebP). Se ajustará automáticamente.",
    en: "Click or drag an image (PNG, JPG or WebP). Auto-resized automatically.",
  },
  preview: {
    es: "Vista Previa",
    en: "Preview",
  },
  saveSettings: {
    es: "Guardar Cambios",
    en: "Save Changes",
  },
  settingsSavedMsg: {
    es: "¡Ajustes guardados correctamente!",
    en: "Settings saved successfully!",
  },
  saveToApply: {
    es: "Guarda para aplicar los cambios",
    en: "Save to apply changes",
  },

  // --- STATS PANEL ---
  totalLibrary: {
    es: "Total Biblioteca",
    en: "Total Library",
  },
  completionRate: {
    es: "Tasa de Superación",
    en: "Completion Rate",
  },
  playTime: {
    es: "Tiempo de Juego",
    en: "Play Time",
  },
  achievementsUnlocked: {
    es: "Logros Desbloqueados",
    en: "Achievements Unlocked",
  },
  inProgress: {
    es: "en curso",
    en: "playing",
  },
  pending: {
    es: "pendientes",
    en: "pending",
  },
  completed: {
    es: "completados",
    en: "completed",
  },
  favorites: {
    es: "favoritos",
    en: "favorites",
  },
  avgHours: {
    es: "Promedio",
    en: "Average",
  },
  hoursPerGame: {
    es: "h por videojuego",
    en: "h per game",
  },

  // --- CONTROLS & FILTERS ---
  filterByStatus: {
    es: "Filtrar por estado",
    en: "Filter by status",
  },
  searchPlaceholder: {
    es: "Buscar por título, género o código de barra...",
    en: "Search by title, genre, or barcode...",
  },
  statusLabel: {
    es: "Estado",
    en: "Status",
  },
  allStatuses: {
    es: "Todos los Estados",
    en: "All Statuses",
  },
  statusPending: {
    es: "Pendientes",
    en: "Pending",
  },
  statusPlaying: {
    es: "Jugando",
    en: "Playing",
  },
  statusPlayed: {
    es: "Jugados",
    en: "Played",
  },
  statusCompleted: {
    es: "Completados",
    en: "Completed",
  },
  statusFavorites: {
    es: "Favoritos",
    en: "Favorites",
  },
  statusWishlist: {
    es: "Quiero Jugar",
    en: "Wishlist",
  },
  consoleLabel: {
    es: "Consola",
    en: "Console",
  },
  allConsoles: {
    es: "Todas las Consolas",
    en: "All Consoles",
  },
  sortByLabel: {
    es: "Ordenar por",
    en: "Sort by",
  },
  sortAcquisitionDate: {
    es: "Fecha Adquisición",
    en: "Acquisition Date",
  },
  sortTitle: {
    es: "Título (A-Z)",
    en: "Title (A-Z)",
  },
  sortPlayTime: {
    es: "Horas de Juego",
    en: "Play Hours",
  },
  sortRating: {
    es: "Calificación",
    en: "Rating",
  },
  showingCount: {
    es: "Mostrando",
    en: "Showing",
  },
  ofCount: {
    es: "de",
    en: "of",
  },
  titlesInLibrary: {
    es: "títulos en tu biblioteca",
    en: "titles in your library",
  },
  emptyLibraryTip: {
    es: "Tu estantería está vacía. ¡Pulsa añadir para empezar!",
    en: "Your shelf is empty. Click add to get started!",
  },
  noGamesMatch: {
    es: "Ningún juego coincide con los filtros",
    en: "No games match the current filters",
  },
  noGamesMatchDesc: {
    es: "Prueba a limpiar la barra de búsqueda o a desactivar los filtros de consola o estado.",
    en: "Try clearing search keywords or resetting console and status filters.",
  },
  resetFilters: {
    es: "Restablecer Filtros",
    en: "Reset Filters",
  },

  // --- GAME CARD & STATUS TAGS ---
  statusPendingTag: {
    es: "Pendiente",
    en: "Pending",
  },
  statusPlayingTag: {
    es: "Jugando",
    en: "Playing",
  },
  statusPlayedTag: {
    es: "Jugado",
    en: "Played",
  },
  statusCompletedTag: {
    es: "Completado",
    en: "Completed",
  },
  statusFavoriteTag: {
    es: "Favorito",
    en: "Favorite",
  },
  statusWishlistTag: {
    es: "Quiero Jugar",
    en: "Wishlist",
  },
  achievementsLabel: {
    es: "Logros",
    en: "Achievements",
  },
  noAchievementsRecorded: {
    es: "Sin logros registrados",
    en: "No achievements recorded",
  },
  hoursPlayed: {
    es: "jugadas",
    en: "played",
  },
  barcodeShort: {
    es: "Cód. barras",
    en: "Barcode",
  },

  // --- ADD GAME FORM & CONSOLE PICKER & IGDB ---
  addGameTitle: {
    es: "Añadir Videojuego a la Biblioteca",
    en: "Add Video Game to Library",
  },
  addGameSubtitle: {
    es: "Añade un nuevo título a tu biblioteca personal",
    en: "Add a new title to your personal library",
  },
  titleRequired: {
    es: "El título es obligatorio",
    en: "Title is required",
  },
  autoImportIgdb: {
    es: "Importar datos automáticamente",
    en: "Import data automatically",
  },
  autoImportDesc: {
    es: "Busca en la base de datos de IGDB los detalles oficiales y portada",
    en: "Search IGDB database for official details and cover",
  },
  searchIgdb: {
    es: "Buscar en IGDB",
    en: "Search IGDB",
  },
  titlePlaceholder: {
    es: "ej. The Legend of Zelda: Tears of the Kingdom",
    en: "e.g. The Legend of Zelda: Tears of the Kingdom",
  },
  releaseDateLabel: {
    es: "Fecha o Año de Lanzamiento",
    en: "Release Date / Year",
  },
  ratingLabel: {
    es: "Calificación (1-5)",
    en: "Rating (1-5)",
  },
  notRated: {
    es: "Sin calificar",
    en: "Not rated",
  },
  playTimeLabel: {
    es: "Horas de Juego",
    en: "Play Time (Hours)",
  },
  coverCustomizer: {
    es: "Personalización de Portada",
    en: "Cover Customization",
  },
  coverImageUrl: {
    es: "URL de la Portada (opcional)",
    en: "Cover Image URL (optional)",
  },
  coverColorLabel: {
    es: "Color de Portada",
    en: "Cover Color",
  },
  customColor: {
    es: "Personalizar color",
    en: "Custom color",
  },
  coverSymbolLabel: {
    es: "Icono de Portada",
    en: "Cover Icon",
  },
  notesLabel: {
    es: "Notas Personales",
    en: "Personal Notes",
  },
  notesPlaceholder: {
    es: "Notas de coleccionista, ubicación...",
    en: "Collector notes, box location...",
  },
  cancelBtn: {
    es: "Cancelar",
    en: "Cancel",
  },
  igdbSearchTitle: {
    es: "Buscar en IGDB",
    en: "Search IGDB",
  },
  igdbSearchBtn: {
    es: "Buscar en IGDB",
    en: "Search IGDB",
  },
  igdbSearching: {
    es: "Buscando en IGDB...",
    en: "Searching IGDB...",
  },
  igdbSelectGame: {
    es: "Seleccionar Juego",
    en: "Select Game",
  },
  igdbRating: {
    es: "Puntuación IGDB",
    en: "IGDB Rating",
  },
  igdbOfficialCover: {
    es: "Portada Oficial IGDB",
    en: "Official IGDB Cover",
  },
  igdbConnected: {
    es: "API IGDB v4 Activa",
    en: "IGDB API v4 Active",
  },
  igdbNotConfigured: {
    es: "Conexión a IGDB",
    en: "IGDB Connection",
  },
  igdbConfigureHint: {
    es: "Añade TWITCH_CLIENT_ID y TWITCH_CLIENT_SECRET en .env para consultas directas a la API v4 de IGDB.",
    en: "Add TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET in .env for direct IGDB v4 API queries.",
  },
  igdbCoverUrlLabel: {
    es: "URL de la Portada / Carátula (IGDB)",
    en: "Cover Image URL (IGDB)",
  },
  igdbCoverUrlPlaceholder: {
    es: "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/...",
    en: "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/...",
  },
  fetchIgdbCover: {
    es: "Obtener portada de IGDB",
    en: "Fetch IGDB cover",
  },
  viewOnIgdb: {
    es: "Ver ficha en IGDB.com",
    en: "View page on IGDB.com",
  },
  igdbImportSuccess: {
    es: "¡Información de \"{name}\" importada correctamente desde IGDB!",
    en: "Information for \"{name}\" imported successfully from IGDB!",
  },
  igdbStatusConnectionError: {
    es: "No se pudo conectar con el servidor local para comprobar el estado de la API.",
    en: "Could not connect to local server to check API status.",
  },
  igdbDefaultError: {
    es: "Error al recibir respuesta de la API de IGDB.",
    en: "Error receiving response from IGDB API.",
  },
  igdbSearchSuccessNotice: {
    es: "Respuesta recibida con éxito de IGDB: {count} juego(s) encontrado(s).",
    en: "Response received successfully from IGDB: {count} game(s) found.",
  },
  igdbSearchZeroNotice: {
    es: "Respuesta recibida de IGDB: 0 resultados encontrados para \"{query}\".",
    en: "Response received from IGDB: 0 results found for \"{query}\".",
  },
  igdbConfigWarning: {
    es: "Aviso de configuración / conexión:",
    en: "Configuration / connection notice:",
  },
  igdbQueryErrorTitle: {
    es: "Error al consultar la API de IGDB:",
    en: "Error querying IGDB API:",
  },
  igdbSearchPlaceholderPrompt: {
    es: "Escribe el nombre de un videojuego arriba",
    en: "Type a video game title above",
  },
  igdbSearchHint: {
    es: "Escribe palabras clave de cualquier consola o franquicia para consultar la base de datos oficial.",
    en: "Type keywords for any console or franchise to query the official database.",
  },
  noCoverText: {
    es: "Sin portada",
    en: "No cover art",
  },
  igdbFooterCredits: {
    es: "Poder de información oficial de IGDB.com",
    en: "Powered by official IGDB.com data",
  },
  removeImage: {
    es: "Quitar imagen",
    en: "Remove image",
  },
  previewCover: {
    es: "Vista previa de la portada",
    en: "Cover preview",
  },
  enlargedImageTitle: {
    es: "Imagen en tamaño completo",
    en: "Full size image",
  },
  openOriginalImage: {
    es: "Abrir imagen original",
    en: "Open original image",
  },
  pressEscToClose: {
    es: "Presiona ESC o haz clic en cualquier lugar para cerrar",
    en: "Press ESC or click anywhere to close",
  },
  gameTitleDefault: {
    es: "Título del juego",
    en: "Game title",
  },
  igdbModalTitle: {
    es: "Buscar Videojuego en IGDB",
    en: "Search Video Game on IGDB",
  },
  igdbModalSubtitle: {
    es: "Obtén información oficial, fechas de lanzamiento, plataformas y la portada oficial en alta resolución.",
    en: "Get official game data, release dates, platforms, and high-res cover art.",
  },
  aiAssistantTitle: {
    es: "Búsqueda en Base de Datos IGDB",
    en: "Search IGDB Database",
  },
  aiAssistantDesc: {
    es: "Busca en la base de datos oficial de IGDB para importar la portada, sinopsis, fechas y plataformas automáticamente.",
    en: "Search the official IGDB database to automatically import cover art, synopsis, dates, and platforms.",
  },
  aiSearching: {
    es: "Buscando en Gemini...",
    en: "Searching Gemini...",
  },
  aiAutofillBtn: {
    es: "Autocompletar con IA",
    en: "Auto-fill with AI",
  },
  aiErrorTitlePrompt: {
    es: "Por favor, introduce el título del videojuego antes de autocompletar.",
    en: "Please enter the game title before auto-filling.",
  },
  aiConnectionError: {
    es: "No se pudo obtener la información de la IA. Comprueba la conexión o intenta más tarde.",
    en: "Could not retrieve AI data. Check your connection or try again later.",
  },
  gameTitleLabel: {
    es: "Título del Videojuego *",
    en: "Video Game Title *",
  },
  gameTitlePlaceholder: {
    es: "Ej: Metroid Prime, Hollow Knight",
    en: "E.g. Metroid Prime, Hollow Knight",
  },
  genreLabel: {
    es: "Género",
    en: "Genre",
  },
  genrePlaceholder: {
    es: "Ej: Metroidvania, RPG",
    en: "E.g. Metroidvania, RPG",
  },
  releaseLabel: {
    es: "Lanzamiento",
    en: "Release",
  },
  releasePlaceholder: {
    es: "Ej: dd/mm/yyyy",
    en: "E.g. dd/mm/yyyy",
  },
  barcodeLabel: {
    es: "Código de Barras (EAN / UPC)",
    en: "Barcode (EAN / UPC)",
  },
  barcodePlaceholder: {
    es: "Ej: 0045496598518 (12-13 números)",
    en: "E.g. 0045496598518 (12-13 digits)",
  },
  generateBarcodeBtn: {
    es: "Generar EAN-13 Real",
    en: "Generate Real EAN-13",
  },
  barcodeCopiedToast: {
    es: "¡Código de barras copiado!",
    en: "Barcode copied to clipboard!",
  },
  barcodePreviewLabel: {
    es: "Vista Previa de Caja / Cartucho",
    en: "Box / Cartridge Preview",
  },
  descriptionLabel: {
    es: "Descripción",
    en: "Description",
  },
  descriptionPlaceholder: {
    es: "Breve resumen del juego, de qué trata o por qué es especial...",
    en: "Short summary of the game, plot, or why it's special...",
  },
  platformsLabel: {
    es: "Plataformas y Consolas",
    en: "Platforms & Consoles",
  },
  selectedConsolesLabel: {
    es: "Consolas seleccionadas",
    en: "Selected consoles",
  },
  noConsolesSelected: {
    es: "Ninguna consola seleccionada",
    en: "No consoles selected",
  },
  searchConsolePlaceholder: {
    es: "Buscar consola (ej: Switch, PS2, Mega Drive, Atari)...",
    en: "Search console (e.g. Switch, PS2, Mega Drive, Atari)...",
  },
  addOtherConsole: {
    es: "Otra consola",
    en: "Other console",
  },
  customConsolePlaceholder: {
    es: "Escribe el nombre de la consola...",
    en: "Type custom console name...",
  },
  add: {
    es: "Añadir",
    en: "Add",
  },
  noConsolesFound: {
    es: "No se encontraron consolas con esa búsqueda.",
    en: "No consoles found matching search.",
  },
  collectionStatusLabel: {
    es: "Estado de Colección",
    en: "Collection Status",
  },
  pendingToPlayOption: {
    es: "Pendiente de Jugar",
    en: "Pending to Play",
  },
  wishlistOption: {
    es: "Quiero Jugar",
    en: "Wishlist",
  },
  wishlist: {
    es: "deseados",
    en: "wishlist",
  },
  currentlyPlayingOption: {
    es: "Jugando Actualmente",
    en: "Currently Playing",
  },
  completedOption: {
    es: "Completado",
    en: "Completed",
  },
  favoritesOption: {
    es: "Favoritos del Alma",
    en: "All-Time Favorites",
  },
  acquisitionDateLabel: {
    es: "Fecha de Adquisición",
    en: "Acquisition Date",
  },
  personalRatingLabel: {
    es: "Calificación Personal",
    en: "Personal Rating",
  },
  playHoursLabel: {
    es: "Horas de Juego",
    en: "Play Hours",
  },
  coverDesignTitle: {
    es: "Diseño de Portada Minimalista",
    en: "Minimalist Cover Design",
  },
  bgColorLabel: {
    es: "Color de Fondo",
    en: "Background Color",
  },
  centralSymbolLabel: {
    es: "Símbolo Central",
    en: "Central Symbol",
  },
  collectorNotesLabel: {
    es: "Notas de Coleccionista",
    en: "Collector Notes",
  },
  collectorNotesPlaceholder: {
    es: "¿Dónde lo compraste? ¿Es de segunda mano o físico? Anota lo que quieras...",
    en: "Where did you buy it? Physical or digital? Note anything you like...",
  },
  gameAchievementsTitle: {
    es: "Logros del Juego",
    en: "Game Achievements",
  },
  gameAchievementsDesc: {
    es: "Desafíos específicos para registrar tu progreso al 100% en este título.",
    en: "Specific challenges to track your 100% completion progress.",
  },
  fetchSteamAchievements: {
    es: "Obtener Logros de Steam",
    en: "Fetch Steam Achievements",
  },
  steamAppIdLabel: {
    es: "Steam App ID (ID del juego en Steam)",
    en: "Steam App ID",
  },
  steamAppIdPlaceholder: {
    es: "Ej: 620 (Portal 2), 1086940 (Baldur's Gate 3)",
    en: "E.g. 620 (Portal 2), 1086940 (Baldur's Gate 3)",
  },
  syncSteamBtn: {
    es: "Importar de Steam",
    en: "Import from Steam",
  },
  syncingSteam: {
    es: "Obteniendo lista de logros desde Steam...",
    en: "Fetching achievements from Steam...",
  },
  steamImportSuccess: {
    es: "¡Se importaron {count} logros de Steam con éxito!",
    en: "Imported {count} Steam achievements successfully!",
  },
  steamImportError: {
    es: "No se pudieron obtener los logros de Steam. Comprueba el App ID o el título.",
    en: "Could not fetch Steam achievements. Please verify the App ID or game title.",
  },
  markAllCompleted: {
    es: "Marcar Todos como Completados",
    en: "Mark All as Completed",
  },
  markAllLocked: {
    es: "Desmarcar Todos",
    en: "Uncheck All",
  },
  steamConnectedNotice: {
    es: "Conectado a la API de Steam (App ID: {id})",
    en: "Connected to Steam API (App ID: {id})",
  },
  steamSearchTitle: {
    es: "Buscar App ID en Steam",
    en: "Search Steam App ID",
  },
  steamSearchPlaceholder: {
    es: "Buscar juego en Steam por nombre...",
    en: "Search game on Steam by title...",
  },
  addAchievementBtn: {
    es: "Añadir Logro",
    en: "Add Achievement",
  },
  noAchievementsEmptyHint: {
    es: "Aún no has añadido logros. ¡Haz clic en \"Añadir Logro\" para incluir desafíos personalizados!",
    en: "No achievements added yet. Click \"Add Achievement\" to include custom challenges!",
  },
  newAchievementName: {
    es: "Nuevo Logro",
    en: "New Achievement",
  },
  newAchievementDesc: {
    es: "Haz algo épico para desbloquear este logro.",
    en: "Do something epic to unlock this achievement.",
  },
  achievementNamePlaceholder: {
    es: "Nombre del logro",
    en: "Achievement name",
  },
  achievementUnlockHow: {
    es: "¿Cómo se consigue?",
    en: "How to unlock it?",
  },
  alreadyUnlockedQuestion: {
    es: "¿Conseguido ya?",
    en: "Already unlocked?",
  },
  difficultyEasy: {
    es: "Fácil",
    en: "Easy",
  },
  difficultyMedium: {
    es: "Medio",
    en: "Medium",
  },
  difficultyHard: {
    es: "Difícil",
    en: "Hard",
  },
  saveToLibraryBtn: {
    es: "Guardar en Biblioteca",
    en: "Save to Library",
  },

  // --- GAME DETAIL MODAL ---
  editGameDetailsTitle: {
    es: "Editar Detalles de Juego",
    en: "Edit Game Details",
  },
  editGameSubtitle: {
    es: "Modifica la información del título en tu biblioteca personal",
    en: "Update game information in your personal library",
  },
  officialBarcodeTitle: {
    es: "Código de Barras Oficial",
    en: "Official Barcode",
  },
  noBarcodeText: {
    es: "Sin código de barras",
    en: "No barcode",
  },
  acquiredLabel: {
    es: "Adquirido",
    en: "Acquired",
  },
  noDateText: {
    es: "Sin fecha",
    en: "No date",
  },
  gameSummaryTitle: {
    es: "Resumen del Juego",
    en: "Game Summary",
  },
  noDescriptionProvided: {
    es: "Este juego no tiene descripción de momento.",
    en: "This game has no description at the moment.",
  },
  achievementsObtainedTitle: {
    es: "Logros Obtenidos",
    en: "Achievements Unlocked",
  },
  percentCompletedText: {
    es: "completado",
    en: "completed",
  },
  noAchievementsDetailHint: {
    es: "Este juego aún no cuenta con logros. Pulsa en Editar arriba para añadir desafíos personalizados.",
    en: "This game does not have achievements yet. Click Edit above to add custom challenges.",
  },
  unlockedOnDate: {
    es: "Desbloqueado el",
    en: "Unlocked on",
  },
  notesAndLogTitle: {
    es: "Notas de Colección y Bitácora",
    en: "Collection Notes & Log",
  },
  notesTextareaPlaceholder: {
    es: "Escribe aquí tus recuerdos, dónde lo conseguiste, sensaciones del juego...",
    en: "Write your memories, purchase location, feelings about the game...",
  },
  confirmDeleteGame: {
    es: "¿Estás seguro de que quieres eliminar este juego de tu biblioteca?",
    en: "Are you sure you want to delete this game from your library?",
  },
  modifyCoverTitle: {
    es: "Modificar Portada",
    en: "Modify Cover",
  },

  // --- CONSOLE CATEGORIES ---
  consoleCategoryAll: {
    es: "Todas",
    en: "All",
  },
  consoleCategorySony: {
    es: "PlayStation",
    en: "PlayStation",
  },
  consoleCategoryNintendo: {
    es: "Nintendo",
    en: "Nintendo",
  },
  consoleCategoryXbox: {
    es: "Xbox",
    en: "Xbox",
  },
  consoleCategorySega: {
    es: "Sega",
    en: "Sega",
  },
  consoleCategoryPCPortable: {
    es: "PC y Portátiles",
    en: "PC & Portables",
  },
  consoleCategoryAtariRetro: {
    es: "Atari y Clásicas",
    en: "Atari & Classics",
  },
  consoleCategoryArcadeOtros: {
    es: "Arcade y Otros",
    en: "Arcade & Others",
  },

  // --- SYMBOL LABELS ---
  symbolGamepad: {
    es: "Mando de juego",
    en: "Game Controller",
  },
  symbolSword: {
    es: "Espada (Acción)",
    en: "Sword (Action)",
  },
  symbolShield: {
    es: "Escudo (Aventura)",
    en: "Shield (Adventure)",
  },
  symbolCrown: {
    es: "Corona (Fantasía/Monarquía)",
    en: "Crown (Fantasy/Monarchy)",
  },
  symbolSkull: {
    es: "Calavera (Terror/Dificultad)",
    en: "Skull (Horror/Difficulty)",
  },
  symbolStar: {
    es: "Estrella (Plataformas/Especial)",
    en: "Star (Platformer/Special)",
  },
  symbolCar: {
    es: "Coche (Carreras)",
    en: "Car (Racing)",
  },
  symbolBolt: {
    es: "Rayo (Velocidad/Acción)",
    en: "Bolt (Speed/Action)",
  },
  symbolGhost: {
    es: "Fantasma (Terror/Retro)",
    en: "Ghost (Horror/Retro)",
  },
  symbolCompass: {
    es: "Brújula (Exploración)",
    en: "Compass (Exploration)",
  },
  symbolFlame: {
    es: "Fuego (Combate/Intenso)",
    en: "Flame (Combat/Intense)",
  },
  symbolTrophy: {
    es: "Trofeo (Logros/Competición)",
    en: "Trophy (Achievements/Competition)",
  },
  symbolSparkles: {
    es: "Destellos (Magia/Indie)",
    en: "Sparkles (Magic/Indie)",
  },
  symbolTarget: {
    es: "Diana (Shooter)",
    en: "Target (Shooter)",
  },
  symbolRocket: {
    es: "Cohete (Espacial/Ciencia Ficción)",
    en: "Rocket (Sci-Fi/Space)",
  },

  // --- ADDITIONAL LABELS & HELPER STRINGS ---
  achievementsLoaded: {
    es: "{count} logros cargados",
    en: "{count} achievements loaded",
  },
  autoLoadAchievements: {
    es: "Carga automática de logros",
    en: "Auto-load achievements",
  },
  noCustomPhoto: {
    es: "Sin foto personalizada",
    en: "No custom photo",
  },
  collectorDefault: {
    es: "Coleccionista",
    en: "Collector",
  },
  invalidServerResponse: {
    es: "Respuesta no válida del servidor local.",
    en: "Invalid response from local server.",
  },
  igdbHtmlError: {
    es: "Respuesta no válida del servidor (HTML). Por favor verifica que las claves de la API de IGDB/Twitch estén configuradas en .env.",
    en: "Invalid response from server (HTML). Please verify IGDB/Twitch API credentials in .env.",
  },
  igdbJsonError: {
    es: "La API de IGDB no devolvió una respuesta JSON válida. Verifica las credenciales de Twitch/IGDB en .env.",
    en: "IGDB API did not return a valid JSON response. Please check Twitch/IGDB credentials in .env.",
  },
  cannotParseServerResponse: {
    es: "No se pudo interpretar la respuesta del servidor.",
    en: "Could not parse server response.",
  },
  hideUrl: {
    es: "Ocultar URL",
    en: "Hide URL",
  },
  steamSearchError: {
    es: "Error al buscar en Steam.",
    en: "Error searching Steam.",
  },
  serverConnError: {
    es: "Error de conexión con el servidor.",
    en: "Connection error with server.",
  },
  steamSearchSubtitle: {
    es: "Busca cualquier título para vincular su ID de Steam",
    en: "Search any title to link its Steam ID",
  },
  search: {
    es: "Buscar",
    en: "Search",
  },
  searchingSteamStore: {
    es: "Buscando en la tienda de Steam...",
    en: "Searching Steam store...",
  },
  noSteamGamesFound: {
    es: "No se encontraron juegos en Steam para tu búsqueda.",
    en: "No Steam games found for your query.",
  },
  select: {
    es: "Seleccionar",
    en: "Select",
  },
  copyBarcode: {
    es: "COPIAR",
    en: "COPY",
  },
  copiedBarcode: {
    es: "COPIADO",
    en: "COPIED",
  },

  // --- COMMON BUTTONS & LABELS ---
  close: {
    es: "Cerrar",
    en: "Close",
  },
  cancel: {
    es: "Cancelar",
    en: "Cancel",
  },
  delete: {
    es: "Eliminar",
    en: "Delete",
  },
  edit: {
    es: "Editar",
    en: "Edit",
  },
  save: {
    es: "Guardar",
    en: "Save",
  },
  hours: {
    es: "horas",
    en: "hours",
  },
  rating: {
    es: "Calificación",
    en: "Rating",
  },
  quickThemeToggleLight: {
    es: "Cambiar a modo claro",
    en: "Switch to light mode",
  },
  quickThemeToggleDark: {
    es: "Cambiar a modo oscuro",
    en: "Switch to dark mode",
  },
  footerTechNote: {
    es: "Integrado con la API oficial de IGDB.",
    en: "Integrated with official IGDB API.",
  },
} as const;

export type TranslationKey = keyof typeof translationTable;

// Memoized dictionary cache for ultra-fast zero-overhead lookups
const translationCache: Partial<Record<Language, Record<TranslationKey, string>>> = {};

/**
 * Highly efficient dictionary lookup generator.
 * Converts the tabular `translationTable` into a fast key-value map for the specified language.
 * Results are cached in memory so subsequent calls in React component renders cost 0ms.
 */
export function getTranslation(lang: Language | string = "en"): Record<TranslationKey, string> {
  const selectedLang: Language = lang === "es" ? "es" : "en";

  if (translationCache[selectedLang]) {
    return translationCache[selectedLang]!;
  }

  const dict = {} as Record<TranslationKey, string>;
  for (const k in translationTable) {
    const key = k as TranslationKey;
    const entry = translationTable[key];
    dict[key] = entry[selectedLang] || entry.en;
  }

  translationCache[selectedLang] = dict;
  return dict;
}

/**
 * Direct tabular query helper for retrieving a single text key in a given language.
 */
export function tKey(key: TranslationKey, lang: Language = "en"): string {
  const entry = translationTable[key];
  if (!entry) return key;
  return entry[lang === "es" ? "es" : "en"] || entry.en;
}

/**
 * Genre dictionary to dynamically translate genre terms between Spanish and English
 */
const genreDictionary: Record<string, { es: string; en: string }> = {
  plataformas: { es: "Plataformas", en: "Platformer" },
  platformer: { es: "Plataformas", en: "Platformer" },
  aventura: { es: "Aventura", en: "Adventure" },
  aventuras: { es: "Aventuras", en: "Adventure" },
  adventure: { es: "Aventura", en: "Adventure" },
  rpg: { es: "RPG", en: "RPG" },
  rol: { es: "Rol", en: "RPG" },
  metroidvania: { es: "Metroidvania", en: "Metroidvania" },
  acción: { es: "Acción", en: "Action" },
  accion: { es: "Acción", en: "Action" },
  action: { es: "Acción", en: "Action" },
  carreras: { es: "Carreras", en: "Racing" },
  racing: { es: "Carreras", en: "Racing" },
  simulador: { es: "Simulador", en: "Simulation" },
  simulación: { es: "Simulación", en: "Simulation" },
  simulacion: { es: "Simulación", en: "Simulation" },
  simulation: { es: "Simulación", en: "Simulation" },
  terror: { es: "Terror", en: "Horror" },
  horror: { es: "Terror", en: "Horror" },
  deportes: { es: "Deportes", en: "Sports" },
  sports: { es: "Deportes", en: "Sports" },
  estrategia: { es: "Estrategia", en: "Strategy" },
  strategy: { es: "Estrategia", en: "Strategy" },
  lucha: { es: "Lucha", en: "Fighting" },
  pelea: { es: "Pelea", en: "Fighting" },
  fighting: { es: "Lucha", en: "Fighting" },
  disparos: { es: "Disparos", en: "Shooter" },
  shooter: { es: "Disparos", en: "Shooter" },
  puzles: { es: "Puzles", en: "Puzzle" },
  puzzle: { es: "Puzles", en: "Puzzle" },
  puzzles: { es: "Puzles", en: "Puzzle" },
  rompecabezas: { es: "Rompecabezas", en: "Puzzle" },
  otros: { es: "Otros", en: "Others" },
  others: { es: "Otros", en: "Others" },
  other: { es: "Otros", en: "Others" },
  conducción: { es: "Conducción", en: "Racing" },
  conduccion: { es: "Conducción", en: "Racing" },
  supervivencia: { es: "Supervivencia", en: "Survival" },
  survival: { es: "Supervivencia", en: "Survival" },
  sandbox: { es: "Sandbox", en: "Sandbox" },
  música: { es: "Música", en: "Music" },
  musica: { es: "Música", en: "Music" },
  music: { es: "Música", en: "Music" },
  ritmo: { es: "Ritmo", en: "Rhythm" },
  rhythm: { es: "Ritmo", en: "Rhythm" },
  "run & gun": { es: "Run & Gun", en: "Run & Gun" },
};

/**
 * Translates genre strings (including compound genres like "Plataformas / Aventura") to the requested language.
 */
export function translateGenre(genreStr: string = "", lang: Language | string = "en"): string {
  if (!genreStr) return "";
  const selectedLang = lang === "es" ? "es" : "en";

  // Split by slashes or commas
  const parts = genreStr.split("/").map((p) => p.trim());

  const translatedParts = parts.map((part) => {
    const lower = part.toLowerCase();
    if (genreDictionary[lower]) {
      return genreDictionary[lower][selectedLang];
    }

    // Replace individual matching keywords
    let updatedPart = part;
    for (const [key, val] of Object.entries(genreDictionary)) {
      const regex = new RegExp(`\\b${key}\\b`, "gi");
      if (regex.test(updatedPart)) {
        updatedPart = updatedPart.replace(regex, val[selectedLang]);
      }
    }
    return updatedPart;
  });

  return translatedParts.join(" / ");
}

/**
 * Translates console category IDs to localized display names.
 */
export function translateConsoleCategory(categoryId: string, lang: Language | string = "en"): string {
  const t = getTranslation(lang);
  switch (categoryId) {
    case "all":
      return t.consoleCategoryAll;
    case "Sony":
      return t.consoleCategorySony;
    case "Nintendo":
      return t.consoleCategoryNintendo;
    case "Xbox":
      return t.consoleCategoryXbox;
    case "Sega":
      return t.consoleCategorySega;
    case "PC & Portable":
      return t.consoleCategoryPCPortable;
    case "Atari & Retro":
      return t.consoleCategoryAtariRetro;
    case "Arcade & Otros":
      return t.consoleCategoryArcadeOtros;
    default:
      return categoryId;
  }
}

/**
 * Symbol key map helper for cover icon labels
 */
const symbolTranslationMap: Record<string, TranslationKey> = {
  gamepad: "symbolGamepad",
  sword: "symbolSword",
  shield: "symbolShield",
  crown: "symbolCrown",
  skull: "symbolSkull",
  star: "symbolStar",
  car: "symbolCar",
  bolt: "symbolBolt",
  ghost: "symbolGhost",
  compass: "symbolCompass",
  flame: "symbolFlame",
  trophy: "symbolTrophy",
  sparkles: "symbolSparkles",
  target: "symbolTarget",
  rocket: "symbolRocket",
};

/**
 * Translates symbol icon labels for cover selection.
 */
export function translateSymbolLabel(symbolId: string, lang: Language | string = "en"): string {
  const t = getTranslation(lang);
  const key = symbolTranslationMap[symbolId];
  if (key && t[key]) {
    return t[key];
  }
  return symbolId;
}

/**
 * Standardized custom hook for React components.
 * Provides dictionary and translation helper functions in a single hook call.
 */
export function useTranslation(lang: Language | string = "en") {
  const selectedLang: Language = lang === "es" ? "es" : "en";
  const t = getTranslation(selectedLang);
  return {
    t,
    lang: selectedLang,
    translateGenre: (genre: string) => translateGenre(genre, selectedLang),
    translateConsoleCategory: (catId: string) => translateConsoleCategory(catId, selectedLang),
    translateSymbolLabel: (symbolId: string) => translateSymbolLabel(symbolId, selectedLang),
  };
}

/**
 * Backward compatibility object mapping for legacy code imports `translations.es` / `translations.en`.
 */
export const translations = {
  get es() {
    return getTranslation("es");
  },
  get en() {
    return getTranslation("en");
  },
};
