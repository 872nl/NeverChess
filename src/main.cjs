
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const fs = require('node:fs');

let loginWindow = null;
let chessWindow = null;
let keyauthSession = null;
let keyauthConfig = null;
let appConfig = null;

function loadConfig() {
  const userDataPath = app.getPath('userData');
  const configFile = path.join(userDataPath, 'config.json');
  const exampleFile = path.join(__dirname, 'config.example.json');

  if (!fs.existsSync(configFile)) {
    if (!fs.existsSync(exampleFile)) {
      throw new Error(
        `No se encontró config.example.json en ${__dirname}`
      );
    }

    fs.mkdirSync(userDataPath, { recursive: true });
    fs.copyFileSync(exampleFile, configFile);
  }

  appConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  keyauthConfig = appConfig.keyauth || {};
}

function validConfig() {
  return Boolean(
    keyauthConfig?.name &&
    keyauthConfig?.ownerid &&
    !String(keyauthConfig.name).startsWith('YOUR_') &&
    !String(keyauthConfig.ownerid).startsWith('YOUR_')
  );
}

function hwid() {
  return crypto
    .createHash('sha256')
    .update(
      os.hostname() + '|' +
      os.platform() + '|' +
      os.arch()
    )
    .digest('hex');
}

async function keyauthRequest(params) {
  const url = new URL('https://keyauth.win/api/1.3/');

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    method: 'GET',
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new Error(`KeyAuth HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'KeyAuth rechazó la solicitud');
  }

  return data;
}

async function initializeKeyAuth() {
  if (keyauthSession) {
    return keyauthSession;
  }

  if (!validConfig()) {
    throw new Error(
      'Configura name y ownerid de KeyAuth en config.json.'
    );
  }

  const result = await keyauthRequest({
    type: 'init',
    name: keyauthConfig.name,
    ownerid: keyauthConfig.ownerid,
    ver: keyauthConfig.version || '1.0'
  });

  keyauthSession = result.sessionid;

  return keyauthSession;
}

async function authenticate(mode, values) {
  const sessionid = await initializeKeyAuth();

  let params;

  if (mode === 'credentials') {
    params = {
      type: 'login',
      username: values.username,
      pass: values.password,
      sessionid,
      name: keyauthConfig.name,
      ownerid: keyauthConfig.ownerid,
      hwid: hwid()
    };
  } else if (mode === 'license') {
    params = {
      type: 'license',
      key: values.license,
      sessionid,
      name: keyauthConfig.name,
      ownerid: keyauthConfig.ownerid,
      hwid: hwid()
    };
  } else {
    throw new Error('Método de acceso no válido.');
  }

  return keyauthRequest(params);
}

function createLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 470,
    height: 650,
    resizable: false,
    autoHideMenuBar: true,
    backgroundColor: '#090d17',

    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  loginWindow.loadFile(path.join(__dirname, 'login.html'));

  loginWindow.on('closed', () => {
    loginWindow = null;
  });
}

function createChessWindow() {
  if (chessWindow && !chessWindow.isDestroyed()) {
    chessWindow.focus();
    return;
  }

  chessWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1000,
    minHeight: 700,
    autoHideMenuBar: true,
    backgroundColor: '#070b13',

    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  const chessUrl = appConfig.chessUrl || 'https://www.chess.com/';

  chessWindow.webContents.on('did-finish-load', async () => {
    if (!chessWindow || chessWindow.isDestroyed()) {
      return;
    }

    const currentUrl = chessWindow.webContents.getURL();

    if (!currentUrl.startsWith('https://www.chess.com/')) {
      return;
    }

    try {
      const scriptPath = path.join(__dirname, 'chess-analysis.js');

      if (!fs.existsSync(scriptPath)) {
        throw new Error('No se encontró chess-analysis.js');
      }

      const code = fs.readFileSync(scriptPath, 'utf8');

      await chessWindow.webContents.executeJavaScript(code, true);

      console.log('[NeverChess] Script cargado en Chess.com');
    } catch (error) {
      console.error('[NeverChess] Error de inyección:', error);
    }
  });

  chessWindow.webContents.on('did-fail-load', (_event, code, description, url) => {
    console.error(
      '[NeverChess] Error al cargar Chess.com:',
      code,
      description,
      url
    );
  });

  chessWindow.on('closed', () => {
    chessWindow = null;
  });

  chessWindow.loadURL(chessUrl);
}

ipcMain.handle('auth:login', async (_event, payload) => {
  try {
    const result = await authenticate(
      payload.mode,
      payload.values || {}
    );

    const links = (appConfig.socialLinks || []).filter(
      link =>
        typeof link === 'string' &&
        /^https:\/\/\S+/.test(link) &&
        !link.includes('example.com')
    );

    // Abrir las redes sociales configuradas
    for (const link of links.slice(0, 2)) {
      try {
        await shell.openExternal(link);
      } catch (error) {
        console.error('[NeverChess] Error abriendo red social:', error);
      }
    }

    createChessWindow();

    if (loginWindow && !loginWindow.isDestroyed()) {
      loginWindow.close();
      loginWindow = null;
    }

    return {
      ok: true,
      username: result.info?.username || 'Authorized'
    };

  } catch (error) {
    console.error('[NeverChess] Error de autenticación:', error);

    return {
      ok: false,
      error: error.message
    };
  }
});

app.whenReady().then(() => {
  try {
    loadConfig();
    createLoginWindow();
  } catch (error) {
    console.error('[NeverChess] Error de configuración:', error);
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createLoginWindow();
  }
});

app.on('window-all-closed', () => {
  if (keyauthSession && keyauthConfig) {
    keyauthRequest({
      type: 'logout',
      sessionid: keyauthSession,
      name: keyauthConfig.name,
      ownerid: keyauthConfig.ownerid
    }).catch(() => {});
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
