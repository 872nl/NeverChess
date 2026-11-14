var hackRunning = false;
var globalDepth = 11;
var engine = null;
var getPlays = null;

var autoPlayEnabled   = false;
var autoPlayDelay     = 800;
var multiPVEnabled    = false;
var multiPVLines      = [];
var lastBestMove      = null;
var autoPlayTimer     = null;
var currentSideGlobal = 'w';
var isPlayerBlackGlobal = false;
var pvAccum           = {};
var currentFenString  = '';
var currentEvalCp     = 0;
var lastEvalCp        = 0;
var moveHistory       = [];
var hintsEnabled      = true;
var soundEnabled      = false;
var engineThreads     = 2;
var engineHash        = 64;
var engineSkill       = 20;
var isExecutingMove   = false;
var pendingAutoPlayFen = null;
var musicEnabled      = true;
var musicVolume       = 0.08;
var miniMode          = false;
var evalHistory       = [];
var autoFlipEnabled   = false;
var blunderAlert      = true;
var lastBlunderBeep   = 0;
var lastMoveQuality   = '';
var persistedSettings = {};

const SETTINGS_KEY = 'neverchess_settings_v4';

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (typeof s.globalDepth === 'number') globalDepth = s.globalDepth;
    if (typeof s.autoPlayDelay === 'number') autoPlayDelay = s.autoPlayDelay;
    if (typeof s.hintsEnabled === 'boolean') hintsEnabled = s.hintsEnabled;
    if (typeof s.soundEnabled === 'boolean') soundEnabled = s.soundEnabled;
    if (typeof s.musicEnabled === 'boolean') musicEnabled = s.musicEnabled;
    if (typeof s.musicVolume === 'number') musicVolume = s.musicVolume;
    if (typeof s.engineThreads === 'number') engineThreads = s.engineThreads;
    if (typeof s.engineHash === 'number') engineHash = s.engineHash;
    if (typeof s.autoFlipEnabled === 'boolean') autoFlipEnabled = s.autoFlipEnabled;
    if (typeof s.blunderAlert === 'boolean') blunderAlert = s.blunderAlert;
  } catch (e) {}
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      globalDepth, autoPlayDelay, hintsEnabled, soundEnabled,
      musicEnabled, musicVolume, engineThreads, engineHash,
      autoFlipEnabled, blunderAlert
    }));
  } catch (e) {}
}

loadSettings();

const ASCII_ART = `
W                                                                     
                                                                                                                                                                                                                                                    
                                                                                                                                                            B BB      BB B                                                                          
                                                                                                                                                                  B                                                                                 
                                                                                                                                                         B   B   B      BB                                                                          
                                                                                                                                                                     B                                                                              
                                                                                                                                                 B   DB DDDDDDDKKKB  BDDD                                                                           
                                                                                                                                               B DDBBDB     BDBB  B B D                                                                             
                                                                                                                                         B  DBDBBB  BB      BBB  BB   B B                                                                           
                                                                                                                                           B    B         BB        BB                                                                              
                                                                                                                                        B B B             B     BB  B                                                                               
                                                                                                                                   B    B                                                                                                           
                                                                                                                                       DB   B                                                                                                       
                                                                                                                               BB BDDB                       DDBD BB                                                                                
                                                                                                                    BDB B  BBBB DDB B   B                 DBDDBBDDB                                                                                 
                                                                                                               BBBB  DBBBDD BDBDD  BDB BB                 BB BBBB                                                                                   
                                                                                                             D   BB BDBBBB       BBB D    BBBB           BB  BB                                                                                     
                                                                                                         B             B   B           BB                                                                                                           
                                                                                                            B        B            B                       B                                                                                         
                                                                                                        B B  B  D    BBBDBBBBB B    BBBBBBBBB   B       BB B D                                                                                      
                                                                                                     B  B           BB B                        B          B                                                                                        
                                                                                                    B    B  B BB BBDB      BBDDDBDBDDBBB D B     B   BKDB                                                                                           
                                                                                                 B  D BBBB B DDBDBDBBDB DKDDDBDDDDDBBDBDDBBBDB  BD   D  B                                                                                           
                                                                                                B   B   BBDD DBBBB  DBDDBBB BBBBBB B     DBB D B    B                                                                                               
                                                                                                                  BB                                B                                                                                               
                                                                                                 D BB BBB       BBB            BB                B B                                                                                                
                                                                                                                      B        B                                                                                                                    
                                                                                                          B       B                                                                                                                                 
                                                                                                  B  DKDK    B  B  B BB  BDDBBBBBDDDDBDDB        B  B                                                                                               
                                                                                                B  BKB   DDDBKDKDDB BDBDDBBBDBBBBDBBDBBBDDDBDB   D                                                                                                  
                                                                                               BDKDDD   BB   BBBBBDDDBDBBDDDBBBBDB BBDDB     B  B                                                                                                   
                                                                                             DBB    BD  DBB B  B B  DBDDB   DDBBDDBDDB  BB   BB                                                                                                     
                                                                                           B           B BBBBB B                       BBB  B   BB                                                                                                  
                                                                                                    B           B                          B                                                                                                        
                                                                                               B D  B      B BB D                         BB                                                                                                        
                                                                                                                                         B                                                                                                          
                                                                                         DBDK      BB   DDDBDBDDBDDDDDDBBBBBDDBDBBB   BBDBBBD                                                                                                       
                                                                                     BBBDDBB         DB      B  BBB B  BDDBBBB BB B D    B                                                                                                          
                                                                                   BBB DDDB             BBBBBB  BD BB   BBBBDBB DB BB  BB                                                                                                           
                                                                                   BBB                      B  B    BBB   B  B BB                                                                                                                   
                                                                                BB                               B   B BB                                                                                                                           
                                                                                                                                                                                                                                                    
                                                                                     B B                        B    B B    B                                                                                                                       
                                                                                 B                          B   B  B                                                                                                                                
                                                                                BBDBBB BD               BBDDBDB                                                                                                                                     
                                                                             BDDDB DDDDBDBDDD    BBDDDDDDB                                                                                                                                          
                                                                            BD BDBBBB BDK    DDKB   BB                                                                                                                                              
                                                                                          BBB       B                                                                                                                                               
                                                                             B              D    B                                                                                                                                                  
                                                                           B  B  BB    BB   B B B B                                                                                                                                                 
                                                                             B B            B                                                                                                                                                       
                                                                           B  BBBBB DB  B   B                                                                                                                                                       
                                                                            D   B B                                                                                                                                                                  
                                                                                                                                                                                                                                                    
                                                                                                                                                                              W
`.trim();

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;500;600;700&display=swap');
  :root {
    --cc-bg-primary: rgba(7, 10, 17, 0.98);
    --cc-bg-secondary: rgba(9, 16, 27, 0.98);
    --cc-bg-glass: rgba(255, 255, 255, 0.035);
    --cc-accent: #079de8;
    --cc-accent-hover: #35baff;
    --cc-accent-glow: rgba(0, 160, 255, 0.25);
    --cc-text-primary: #e8edf5;
    --cc-text-secondary: #a3adbd;
    --cc-text-muted: #68778c;
    --cc-border: rgba(0, 153, 235, 0.22);
    --cc-success: #4ade80;
    --cc-danger: #f87171;
    --cc-warn: #f59e0b;
    --cc-eval-white: #e8e8e8;
    --cc-eval-black: #2a2a35;
  }
  .cc-panel {
    position: fixed; top: 80px; right: 20px; width: 390px;
    min-width: 240px; max-width: calc(100vw - 24px);
    background: var(--cc-bg-primary); border: 1px solid var(--cc-border);
    border-radius: 10px; padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    z-index: 999999;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.05) inset;
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    transition: box-shadow .3s ease, width .15s ease;
  }
  .cc-panel:hover {
    box-shadow: 0 25px 50px -12px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.08) inset, 0 0 40px rgba(0,153,235,.09);
  }
  .cc-panel.collapsed .cc-content { display: none !important; }
  .cc-panel.mini .cc-content > *:not(.cc-move-display) { display: none !important; }
  .cc-panel.mini .cc-move-display { margin: 0; padding: 8px; background: transparent; border: none; }
  .cc-panel.mini .cc-best-move { font-size: 16px; padding: 6px; min-height: 32px; }
  .cc-panel.mini .cc-move-header { display: none; }

  .cc-resize-handle {
    position: absolute; left: 0; top: 0; bottom: 0; width: 6px;
    cursor: ew-resize; z-index: 10000; background: transparent;
    border-radius: 10px 0 0 10px;
  }
  .cc-resize-handle:hover { background: rgba(0,153,235,.3); }

  .cc-header {
    background: linear-gradient(135deg, var(--cc-bg-secondary) 0%, var(--cc-bg-glass) 100%);
    padding: 10px 14px; border-bottom: 1px solid var(--cc-border);
    display: flex; align-items: center; justify-content: space-between;
    gap: 10px; cursor: move; touch-action: none;
    border-radius: 10px 10px 0 0;
  }
  .cc-panel.collapsed .cc-header { border-bottom: none; border-radius: 10px; }
  .cc-logo { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .cc-logo-icon {
    width: 24px; height: 24px;
    background: linear-gradient(135deg, var(--cc-accent) 0%, #0877c4 100%);
    border-radius: 5px; display: flex; align-items: center; justify-content: center;
    font-size: 14px; box-shadow: 0 2px 8px var(--cc-accent-glow);
  }
  .cc-logo-text { font-size: 14px; font-weight: 700; color: var(--cc-text-primary); letter-spacing: -.3px; white-space: nowrap; }
  .cc-logo-text span { color: var(--cc-accent); }
  .cc-status-badge {
    display: flex; align-items: center; gap: 5px;
    font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .3px;
    padding: 3px 8px; border-radius: 20px;
    background: var(--cc-bg-glass); border: 1px solid var(--cc-border); transition: all .3s ease;
  }
  .cc-status-badge .dot { width: 5px; height: 5px; border-radius: 50%; background: var(--cc-text-muted); transition: all .3s ease; }
  .cc-status-badge.active { background: rgba(74,222,128,.15); border-color: rgba(74,222,128,.4); }
  .cc-status-badge.active .dot { background: var(--cc-success); box-shadow: 0 0 8px var(--cc-success); animation: pulse 2s infinite; }
  .cc-status-badge.active #cc-status-text { color: var(--cc-success); }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(1.2)} }
  .cc-header-right { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
  .cc-icon-btn {
    background: var(--cc-bg-glass); border: 1px solid var(--cc-border);
    border-radius: 5px; width: 22px; height: 22px; cursor: pointer;
    color: var(--cc-text-secondary); font-size: 11px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    transition: all .2s; padding: 0; font-family: inherit;
  }
  .cc-icon-btn:hover { border-color: var(--cc-accent); color: var(--cc-accent); }
  .cc-icon-btn.active { border-color: var(--cc-accent); color: var(--cc-accent); background: rgba(0,153,235,.1); }
  .cc-player-indicator {
    display: flex; align-items: center; gap: 3px; padding: 3px 6px;
    background: var(--cc-bg-glass); border: 1px solid var(--cc-border); border-radius: 5px; font-size: 10px;
  }
  .cc-player-indicator .cc-piece { font-size: 12px; line-height: 1; }
  .cc-player-indicator .cc-color-text { color: var(--cc-text-primary); font-weight: 600; }
  .cc-player-indicator.white { border-color: rgba(255,255,255,.2); }
  .cc-player-indicator.white .cc-piece { color: #fff; text-shadow: 0 0 4px rgba(255,255,255,.5); }
  .cc-player-indicator.black { border-color: rgba(100,100,100,.3); }
  .cc-player-indicator.black .cc-piece { color: #1a1a1a; background: #333; border-radius: 2px; padding: 0 2px; }

  .cc-content { max-height: 80vh; overflow-y: auto; overflow-x: hidden; }
  .cc-content::-webkit-scrollbar { width: 6px; }
  .cc-content::-webkit-scrollbar-thumb { background: rgba(0,153,235,.3); border-radius: 3px; }
  .cc-content::-webkit-scrollbar-track { background: transparent; }

  .cc-body { padding: 14px 18px; }
  .cc-toggle-wrapper { margin-bottom: 12px; }
  .cc-toggle {
    width: 100%; padding: 12px 22px; border: none; border-radius: 10px;
    font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer;
    transition: all .3s cubic-bezier(.4,0,.2,1);
    display: flex; align-items: center; justify-content: center; gap: 8px;
    position: relative; overflow: hidden;
  }
  .cc-toggle::before {
    content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
    background: linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);
    transition: left .5s ease;
  }
  .cc-toggle:hover::before { left: 100%; }
  .cc-toggle.start { background: linear-gradient(135deg, var(--cc-accent) 0%, #0877c4 100%); color: #1a1a1a; box-shadow: 0 4px 15px var(--cc-accent-glow); }
  .cc-toggle.start:hover { background: linear-gradient(135deg, var(--cc-accent-hover) 0%, var(--cc-accent) 100%); transform: translateY(-1px); box-shadow: 0 6px 20px var(--cc-accent-glow); }
  .cc-toggle.stop { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; box-shadow: 0 4px 15px rgba(220,38,38,.3); }
  .cc-toggle.stop:hover { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); transform: translateY(-1px); }
  .cc-toggle:disabled { opacity: .6; cursor: not-allowed; transform: none !important; }

  .cc-controls-section { margin-bottom: 12px; background: var(--cc-bg-secondary); border-radius: 10px; padding: 10px 14px; border: 1px solid var(--cc-border); }
  .cc-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 7px 0; border-bottom: 1px solid rgba(0,153,235,.08);
  }
  .cc-row:last-child { border-bottom: none; }
  .cc-row-label { font-size: 11px; font-weight: 600; color: var(--cc-text-secondary); text-transform: uppercase; letter-spacing: .5px; }
  .cc-switch { position: relative; width: 36px; height: 20px; flex-shrink: 0; }
  .cc-switch input { opacity: 0; width: 0; height: 0; }
  .cc-switch-slider { position: absolute; cursor: pointer; inset: 0; background: #1e2130; border-radius: 20px; transition: .3s; }
  .cc-switch-slider::before { content: ''; position: absolute; height: 14px; width: 14px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: .3s; }
  .cc-switch input:checked + .cc-switch-slider { background: var(--cc-success); }
  .cc-switch input:checked + .cc-switch-slider::before { transform: translateX(16px); }

  .cc-delay-wrap { display: flex; align-items: center; gap: 8px; }
  .cc-delay-val { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--cc-accent); min-width: 42px; text-align: right; }

  .cc-play-now {
    width: 100%; padding: 9px; border: 1px solid var(--cc-border); border-radius: 8px;
    background: rgba(0,153,235,.07); color: var(--cc-accent);
    font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 700;
    letter-spacing: .5px; cursor: pointer; transition: all .2s;
    display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 10px;
  }
  .cc-play-now:hover { background: rgba(0,153,235,.18); border-color: var(--cc-accent); }
  .cc-play-now:disabled { opacity: .4; cursor: not-allowed; }

  .cc-multiline { margin-top: 10px; display: flex; flex-direction: column; gap: 4px; }
  .cc-line-item {
    display: flex; align-items: center; gap: 8px; padding: 5px 10px;
    background: var(--cc-bg-glass); border-radius: 6px; border: 1px solid rgba(0,153,235,.1);
    cursor: pointer; transition: all .2s;
  }
  .cc-line-item:hover { border-color: var(--cc-accent); background: rgba(0,153,235,.08); }
  .cc-line-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .cc-line-move { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; color: var(--cc-text-primary); flex: 1; }
  .cc-line-eval { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--cc-text-muted); }

  .cc-move-display {
    background: var(--cc-bg-secondary); border-radius: 12px; padding: 14px;
    border: 1px solid var(--cc-border); transition: all .3s ease;
  }
  .cc-move-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
  .cc-move-header svg { width: 16px; height: 16px; color: var(--cc-accent); }
  .cc-move-header > span:first-of-type { font-size: 11px; font-weight: 600; color: var(--cc-text-secondary); text-transform: uppercase; letter-spacing: .5px; }
  .cc-quality { margin-left: auto; font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 10px; text-transform: uppercase; letter-spacing: .5px; display: none; }
  .cc-quality.show { display: inline-block; }
  .cc-quality.brilliant { background: rgba(74,222,128,.15); color: var(--cc-success); border: 1px solid rgba(74,222,128,.4); }
  .cc-quality.great { background: rgba(0,153,235,.15); color: var(--cc-accent); border: 1px solid rgba(0,153,235,.4); }
  .cc-quality.good { background: rgba(140,180,120,.15); color: #a3c78f; border: 1px solid rgba(140,180,120,.4); }
  .cc-quality.inaccuracy { background: rgba(245,158,11,.15); color: var(--cc-warn); border: 1px solid rgba(245,158,11,.4); }
  .cc-quality.mistake { background: rgba(249,115,22,.15); color: #f97316; border: 1px solid rgba(249,115,22,.4); }
  .cc-quality.blunder { background: rgba(248,113,113,.15); color: var(--cc-danger); border: 1px solid rgba(248,113,113,.4); }
  .cc-best-move {
    font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 600;
    color: var(--cc-text-primary); text-align: center; padding: 12px;
    background: var(--cc-bg-glass); border-radius: 8px; letter-spacing: 2px;
    min-height: 50px; display: flex; align-items: center; justify-content: center; transition: all .3s ease;
  }
  .cc-best-move.calculating { color: var(--cc-text-muted); animation: shimmer 1.5s infinite; }
  @keyframes shimmer { 0%{opacity:.5} 50%{opacity:1} 100%{opacity:.5} }
  .cc-best-move.ready { color: var(--cc-accent); text-shadow: 0 0 20px var(--cc-accent-glow); }
  .cc-best-move.autoplayed { animation: autoflash .4s ease; }
  @keyframes autoflash { 0%{background:rgba(74,222,128,.3)} 100%{background:var(--cc-bg-glass)} }

  .cc-eval-container { margin-top: 12px; }
  .cc-eval-bar { height: 20px; background: var(--cc-eval-black); border-radius: 10px; overflow: hidden; position: relative; }
  .cc-eval-fill { position: absolute; top: 0; left: 0; height: 100%; background: linear-gradient(90deg, var(--cc-eval-white) 0%, #c0c0c0 100%); transition: width .5s cubic-bezier(.4,0,.2,1); border-radius: 10px; }
  .cc-eval-value { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; color: var(--cc-text-primary); text-shadow: 0 1px 2px rgba(0,0,0,.5); }

  .cc-evalgraph { margin-top: 8px; height: 28px; background: rgba(0,0,0,.3); border-radius: 6px; overflow: hidden; }
  .cc-evalgraph svg { width: 100%; height: 100%; display: block; }

  .cc-arrow-indicator { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 10px; padding: 8px; background: rgba(0,153,235,.045); border-radius: 8px; border: 1px dashed rgba(0,153,235,.22); }
  .cc-arrow-indicator span { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--cc-accent); }

  .cc-footer { padding: 10px 18px; background: var(--cc-bg-glass); border-top: 1px solid var(--cc-border); display: flex; align-items: center; justify-content: center; gap: 6px; }
  .cc-footer span { font-size: 10px; color: var(--cc-text-muted); }
  .cc-footer span strong { color: var(--cc-accent); font-weight: 600; }

  .cheat-highlight { position: absolute; border-radius: 4px; pointer-events: none; z-index: 100; transition: all .4s cubic-bezier(.4,0,.2,1) !important; }
  .cheat-highlight.from-square { background: radial-gradient(circle, rgba(59,130,246,.5) 0%, rgba(59,130,246,.2) 70%, transparent 100%) !important; box-shadow: inset 0 0 0 3px #3b82f6, 0 0 15px rgba(59,130,246,.5) !important; animation: highlightPulse 2s infinite; }
  .cheat-highlight.to-square { background: radial-gradient(circle, rgba(59,130,246,.5) 0%, rgba(59,130,246,.2) 70%, transparent 100%) !important; box-shadow: inset 0 0 0 3px #3b82f6, 0 0 15px rgba(59,130,246,.5) !important; animation: highlightPulse 2s infinite .5s; }
  @keyframes highlightPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.8;transform:scale(1.02)} }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  .spin { animation: spin 1s linear infinite; }

  .cc-actions { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-top: 10px; }
  .cc-action-btn {
    padding: 7px 8px; border: 1px solid var(--cc-border); border-radius: 6px;
    background: var(--cc-bg-glass); color: var(--cc-text-secondary);
    font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 600;
    letter-spacing: .3px; cursor: pointer; transition: all .2s;
    display: flex; align-items: center; justify-content: center; gap: 4px;
  }
  .cc-action-btn:hover { border-color: var(--cc-accent); color: var(--cc-accent); }
  .cc-action-btn.active { border-color: var(--cc-accent); color: var(--cc-accent); background: rgba(0,153,235,.1); }
  .cc-action-btn.copied { border-color: var(--cc-success); color: var(--cc-success); }

  .cc-history { margin-top: 8px; max-height: 100px; overflow-y: auto; display: flex; flex-direction: column; gap: 3px; padding: 6px; background: rgba(0,0,0,.2); border-radius: 6px; border: 1px solid rgba(0,153,235,.08); }
  .cc-history:empty { display: none; }
  .cc-history-item { display: flex; justify-content: space-between; padding: 3px 8px; background: var(--cc-bg-glass); border-radius: 4px; font-size: 11px; font-family: 'JetBrains Mono', monospace; cursor: pointer; transition: all .2s; }
  .cc-history-item:hover { background: rgba(0,153,235,.1); }
  .cc-history-move { color: var(--cc-text-primary); font-weight: 600; }
  .cc-history-eval { color: var(--cc-text-muted); }
  .cc-history-header { font-size: 10px; font-weight: 600; color: var(--cc-text-muted); text-transform: uppercase; letter-spacing: .5px; margin: 8px 0 4px; }

  .cc-advanced { margin-top: 12px; border-top: 1px solid rgba(0,153,235,.08); padding-top: 10px; }
  .cc-advanced-header { cursor: pointer; font-size: 11px; font-weight: 600; color: var(--cc-text-secondary); text-transform: uppercase; letter-spacing: .5px; display: flex; justify-content: space-between; align-items: center; user-select: none; }
  .cc-advanced-header:hover { color: var(--cc-accent); }
  .cc-advanced-content { display: none; margin-top: 10px; }
  .cc-advanced.open .cc-advanced-content { display: block; }
  .cc-advanced.open .cc-advanced-arrow { transform: rotate(180deg); }
  .cc-advanced-arrow { transition: transform .2s; font-size: 9px; }
  .cc-advanced-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; margin-top: 8px; }
  .cc-advanced-row label { font-size: 11px; color: var(--cc-text-secondary); }
  .cc-advanced-row .cc-depth-value { font-size: 11px; padding: 1px 7px; }

  .cc-fen-input {
    width: 100%; padding: 6px 8px; border-radius: 6px;
    background: var(--cc-bg-secondary); border: 1px solid var(--cc-border);
    color: var(--cc-text-primary); font-family: 'JetBrains Mono', monospace;
    font-size: 10px; margin-top: 6px; box-sizing: border-box;
    outline: none;
  }
  .cc-fen-input:focus { border-color: var(--cc-accent); }

  .cc-depth-control { margin-bottom: 12px; }
  .cc-control-label { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .cc-control-label span { font-size: 12px; font-weight: 500; color: var(--cc-text-secondary); text-transform: uppercase; letter-spacing: .5px; }
  .cc-depth-value { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600; color: var(--cc-accent); background: rgba(0,153,235,.09); padding: 2px 10px; border-radius: 6px; }
  .cc-slider-container { position: relative; height: 6px; background: var(--cc-bg-secondary); border-radius: 3px; overflow: visible; }
  .cc-slider-fill { position: absolute; top: 0; left: 0; height: 100%; background: linear-gradient(90deg, var(--cc-accent) 0%, var(--cc-accent-hover) 100%); border-radius: 3px; transition: width .1s ease; }
  .cc-slider { position: absolute; top: 50%; left: 0; transform: translateY(-50%); width: 100%; height: 24px; -webkit-appearance: none; appearance: none; background: transparent; cursor: pointer; }
  .cc-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: linear-gradient(135deg,#fff 0%,#e0e0e0 100%); border-radius: 50%; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,.3), 0 0 0 2px var(--cc-accent); transition: all .2s ease; }
  .cc-slider::-webkit-slider-thumb:hover { transform: scale(1.1); box-shadow: 0 2px 12px rgba(0,0,0,.4), 0 0 0 3px var(--cc-accent); }
  .cc-slider::-moz-range-thumb { width: 18px; height: 18px; background: linear-gradient(135deg,#fff 0%,#e0e0e0 100%); border-radius: 50%; cursor: pointer; border: none; box-shadow: 0 2px 8px rgba(0,0,0,.3), 0 0 0 2px var(--cc-accent); }
  .cc-depth-hints { display: flex; justify-content: space-between; margin-top: 8px; font-size: 10px; color: var(--cc-text-muted); }
  .cc-preset-row { display: flex; gap: 4px; margin-top: 8px; }
  .cc-preset-btn { flex: 1; padding: 4px; border: 1px solid var(--cc-border); border-radius: 5px; background: var(--cc-bg-glass); color: var(--cc-text-muted); font-size: 9px; font-weight: 600; cursor: pointer; transition: all .2s; font-family: inherit; }
  .cc-preset-btn:hover, .cc-preset-btn.active { border-color: var(--cc-accent); color: var(--cc-accent); }

  .cc-clock {
    display: flex; justify-content: space-between; align-items: center;
    padding: 6px 10px; background: var(--cc-bg-glass); border-radius: 6px;
    border: 1px solid var(--cc-border); margin-bottom: 10px;
    font-family: 'JetBrains Mono', monospace; font-size: 11px;
  }
  .cc-clock-side { display: flex; align-items: center; gap: 4px; color: var(--cc-text-secondary); }
  .cc-clock-side.active { color: var(--cc-accent); font-weight: 700; }
  .cc-clock-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--cc-text-muted); }
  .cc-clock-side.active .cc-clock-dot { background: var(--cc-accent); box-shadow: 0 0 6px var(--cc-accent); }
`;

let musicCtx = null;
let musicGain = null;
let musicLoopTimer = null;
let musicStep = 0;
let musicStarted = false;

const MUSIC_SEQ = [523.25, 659.25, 783.99, 1046.50, 783.99, 659.25, 587.33, 493.88,
                   523.25, 659.25, 783.99, 1046.50, 880.00, 783.99, 659.25, 523.25];
const MUSIC_BASS = [130.81, 130.81, 98.00, 98.00, 110.00, 110.00, 87.31, 87.31,
                    130.81, 130.81, 98.00, 98.00, 116.54, 116.54, 87.31, 87.31];

function scheduleMusicStep() {
  if (!musicCtx || musicCtx.state === 'closed') return;
  const now = musicCtx.currentTime;
  const stepDur = 0.15;

  try {
    const lead = musicCtx.createOscillator();
    const leadGain = musicCtx.createGain();
    lead.type = 'square';
    lead.frequency.value = MUSIC_SEQ[musicStep % MUSIC_SEQ.length];
    leadGain.gain.setValueAtTime(0.0001, now);
    leadGain.gain.exponentialRampToValueAtTime(0.12, now + 0.005);
    leadGain.gain.exponentialRampToValueAtTime(0.0001, now + stepDur * 0.9);
    lead.connect(leadGain); leadGain.connect(musicGain);
    lead.start(now); lead.stop(now + stepDur);

    const bass = musicCtx.createOscillator();
    const bassGain = musicCtx.createGain();
    bass.type = 'triangle';
    bass.frequency.value = MUSIC_BASS[musicStep % MUSIC_BASS.length];
    bassGain.gain.setValueAtTime(0.0001, now);
    bassGain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, now + stepDur * 1.8);
    bass.connect(bassGain); bassGain.connect(musicGain);
    bass.start(now); bass.stop(now + stepDur * 2);
  } catch (e) {}

  musicStep++;
}

function startMusic() {
  if (musicCtx && musicCtx.state !== 'closed') return;
  try {
    musicCtx = new (window.AudioContext || window.webkitAudioContext)();
    musicGain = musicCtx.createGain();
    musicGain.gain.value = musicVolume;
    musicGain.connect(musicCtx.destination);
    if (musicCtx.state === 'suspended') musicCtx.resume().catch(() => {});
    const tick = () => {
      scheduleMusicStep();
      musicLoopTimer = setTimeout(tick, 150);
    };
    tick();
    musicStarted = true;
  } catch (e) {}
}

function stopMusic() {
  clearTimeout(musicLoopTimer);
  musicLoopTimer = null;
  if (musicCtx) { try { musicCtx.close(); } catch (e) {} musicCtx = null; musicGain = null; }
  musicStarted = false;
}

function ensureMusicRunning() {
  if (!musicEnabled) return;
  if (!musicCtx) {
    startMusic();
  } else if (musicCtx.state === 'suspended') {
    musicCtx.resume().catch(() => {});
  }
}

document.addEventListener('pointerdown', ensureMusicRunning, { passive: true });
document.addEventListener('keydown', ensureMusicRunning, { passive: true });
document.addEventListener('touchstart', ensureMusicRunning, { passive: true });
document.addEventListener('click', ensureMusicRunning, { passive: true });

function injectStyles() {
  const existing = document.getElementById('cc-styles');
  if (existing) existing.remove();
  const style = document.createElement('style');
  style.id = 'cc-styles';
  style.textContent = STYLES;
  document.head.appendChild(style);
}

function createPanelHTML() {
  return `
    <div class="cc-resize-handle" id="cc-resize-handle"></div>
    <div class="cc-header" id="cc-header">
      <div class="cc-logo">
        <div class="cc-logo-icon">♞</div>
        <div class="cc-logo-text">NEVER<span>CHESS</span></div>
      </div>
      <div class="cc-header-right">
        <button class="cc-icon-btn" id="cc-music-btn" title="Music">♪</button>
        <button class="cc-icon-btn" id="cc-mini-btn" title="Mini mode">▭</button>
        <button class="cc-icon-btn" id="cc-collapse-btn" title="Collapse">▾</button>
        <div class="cc-player-indicator white" id="cc-player-indicator">
          <span class="cc-piece">♔</span>
          <span class="cc-color-text">White</span>
        </div>
        <div class="cc-status-badge" id="cc-status">
          <span class="dot"></span>
          <span id="cc-status-text">Ready</span>
        </div>
      </div>
    </div>

    <div class="cc-content" id="cc-content">
      <div class="cc-body">
        <div class="cc-clock" id="cc-clock">
          <div class="cc-clock-side" id="cc-clock-white"><span class="cc-clock-dot"></span><span>White</span></div>
          <span style="color:var(--cc-text-muted);">vs</span>
          <div class="cc-clock-side" id="cc-clock-black"><span class="cc-clock-dot"></span><span>Black</span></div>
        </div>

        <div class="cc-toggle-wrapper">
          <button class="cc-toggle start" id="cc-toggle-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span id="cc-toggle-text">Start Analysis</span>
          </button>
        </div>

        <div class="cc-controls-section">
          <div class="cc-row">
            <span class="cc-row-label">Auto Play</span>
            <label class="cc-switch">
              <input type="checkbox" id="cc-autoplay-toggle">
              <span class="cc-switch-slider"></span>
            </label>
          </div>
          <div class="cc-row">
            <span class="cc-row-label">Multi Line</span>
            <label class="cc-switch">
              <input type="checkbox" id="cc-multiline-toggle">
              <span class="cc-switch-slider"></span>
            </label>
          </div>
          <div class="cc-row">
            <span class="cc-row-label">Auto Flip</span>
            <label class="cc-switch">
              <input type="checkbox" id="cc-autoflip-toggle">
              <span class="cc-switch-slider"></span>
            </label>
          </div>
          <div class="cc-row">
            <span class="cc-row-label">Blunder Alert</span>
            <label class="cc-switch">
              <input type="checkbox" id="cc-blunder-toggle" checked>
              <span class="cc-switch-slider"></span>
            </label>
          </div>
          <div class="cc-row">
            <span class="cc-row-label">Delay</span>
            <div class="cc-delay-wrap">
              <input type="range" class="cc-slider" id="cc-delay-slider" min="100" max="3000" step="100" value="800" style="width:90px;position:static;transform:none;height:6px;">
              <span class="cc-delay-val" id="cc-delay-val">800ms</span>
            </div>
          </div>
        </div>

        <div class="cc-depth-control">
          <div class="cc-control-label">
            <span>Analysis Depth</span>
            <div class="cc-depth-value" id="cc-depth-display">${globalDepth}</div>
          </div>
          <div class="cc-slider-container">
            <div class="cc-slider-fill" id="cc-slider-fill" style="width:${(globalDepth/40)*100}%"></div>
            <input type="range" class="cc-slider" id="cc-depth-slider" min="1" max="40" value="${globalDepth}">
          </div>
          <div class="cc-preset-row">
            <button class="cc-preset-btn" data-depth="5">Fast</button>
            <button class="cc-preset-btn active" data-depth="11">Normal</button>
            <button class="cc-preset-btn" data-depth="18">Strong</button>
            <button class="cc-preset-btn" data-depth="25">Max</button>
          </div>
        </div>

        <div class="cc-move-display">
          <div class="cc-move-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span>Best Move</span>
            <span class="cc-quality" id="cc-quality"></span>
          </div>
          <div class="cc-best-move calculating" id="cc-best-move">Waiting...</div>

          <div class="cc-eval-container">
            <div class="cc-eval-bar">
              <div class="cc-eval-fill" id="cc-eval-fill" style="width:50%"></div>
              <span class="cc-eval-value" id="cc-eval-value">0.0</span>
            </div>
            <div class="cc-evalgraph" id="cc-evalgraph"><svg id="cc-evalgraph-svg" preserveAspectRatio="none" viewBox="0 0 100 30"><polyline id="cc-evalgraph-line" points="" fill="none" stroke="#079de8" stroke-width="1.5"/></svg></div>
          </div>

          <div class="cc-arrow-indicator" id="cc-arrow-indicator" style="display:none;">
            <span id="cc-from-square">-</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
            <span id="cc-to-square">-</span>
          </div>

          <div class="cc-multiline" id="cc-multiline" style="display:none;"></div>

          <button class="cc-play-now" id="cc-play-now" disabled>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            Play Best Move Now
          </button>
        </div>

        <div class="cc-actions">
          <button class="cc-action-btn" id="cc-copy-fen">Copy FEN</button>
          <button class="cc-action-btn active" id="cc-hints-toggle">Hints On</button>
          <button class="cc-action-btn" id="cc-sound-toggle">Sound Off</button>
          <button class="cc-action-btn" id="cc-flip-btn">Flip Board</button>
          <button class="cc-action-btn" id="cc-copy-pgn">Export PGN</button>
          <button class="cc-action-btn" id="cc-load-fen">Load FEN</button>
        </div>
        <input type="text" class="cc-fen-input" id="cc-fen-input" placeholder="paste FEN + press Enter" style="display:none;">

        <div class="cc-history-header">Move History</div>
        <div class="cc-history" id="cc-history"></div>

        <div class="cc-advanced" id="cc-advanced">
          <div class="cc-advanced-header" id="cc-advanced-header">
            <span>Engine Settings</span>
            <span class="cc-advanced-arrow">▼</span>
          </div>
          <div class="cc-advanced-content">
            <div class="cc-advanced-row">
              <label>Threads</label>
              <span class="cc-depth-value" id="cc-threads-val">${engineThreads}</span>
            </div>
            <input type="range" class="cc-slider" id="cc-threads-slider" min="1" max="16" step="1" value="${engineThreads}" style="position:static;transform:none;height:6px;">
            <div class="cc-advanced-row">
              <label>Hash (MB)</label>
              <span class="cc-depth-value" id="cc-hash-val">${engineHash}</span>
            </div>
            <input type="range" class="cc-slider" id="cc-hash-slider" min="16" max="1024" step="16" value="${engineHash}" style="position:static;transform:none;height:6px;">
            <div class="cc-advanced-row">
              <label>Music Volume</label>
              <span class="cc-depth-value" id="cc-music-vol-val">${Math.round(musicVolume * 100)}%</span>
            </div>
            <input type="range" class="cc-slider" id="cc-music-vol-slider" min="0" max="100" step="5" value="${Math.round(musicVolume * 100)}" style="position:static;transform:none;height:6px;">
          </div>
        </div>
      </div>

      <div class="cc-footer">
        <span>NeverChess <strong>by butizada</strong> · Stockfish</span>
      </div>
    </div>
  `;
}

function playBeep(freq, dur, vol) {
  if (!soundEnabled) return;
  freq = freq || 880; dur = dur || 0.15; vol = vol || 0.08;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
    setTimeout(() => { try { ctx.close(); } catch (e) {} }, dur * 1000 + 100);
  } catch (e) {}
}

function playBlunderSound() {
  if (!blunderAlert) return;
  playBeep(220, 0.4, 0.12);
  setTimeout(() => playBeep(180, 0.4, 0.12), 120);
}

function fireEvent(x, y, type) {
  const el = document.elementFromPoint(x, y);
  if (!el || el.closest('.cc-panel')) return null;
  const opts = {
    bubbles: true, cancelable: true, clientX: x, clientY: y,
    view: window, button: 0, buttons: 1, pointerId: 1, pointerType: 'mouse'
  };
  const mouseType = type.replace('pointer', 'mouse');
  try { el.dispatchEvent(new PointerEvent(type, opts)); } catch (e) {}
  if (mouseType !== type) el.dispatchEvent(new MouseEvent(mouseType, opts));
  else el.dispatchEvent(new MouseEvent(type, opts));
  return el;
}

function executeMove(move) {
  if (!move || move.length < 4) return false;
  const board = document.querySelector('wc-chess-board');
  if (!board) return false;

  const panel = document.getElementById('cc-panel');
  const prevPE = panel ? panel.style.pointerEvents : null;
  if (panel) panel.style.pointerEvents = 'none';

  const rect    = board.getBoundingClientRect();
  const sq      = rect.width / 8;
  const flipped = isPlayerBlackGlobal;

  const xy = (file, rank) => ({
    x: rect.left + (flipped ? 8 - file : file - 1) * sq + sq / 2,
    y: rect.top  + (flipped ? rank - 1 : 8 - rank) * sq + sq / 2
  });

  const charMap = { a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8 };
  const ff = charMap[move[0]], fr = parseInt(move[1]);
  const tf = charMap[move[2]], tr = parseInt(move[3]);
  if (!ff || !tf) { if (panel) panel.style.pointerEvents = prevPE || ''; return false; }

  const from = xy(ff, fr);
  const to   = xy(tf, tr);

  fireEvent(from.x, from.y, 'pointerdown');
  fireEvent(from.x, from.y, 'pointerup');
  fireEvent(from.x, from.y, 'mousedown');
  fireEvent(from.x, from.y, 'mouseup');
  fireEvent(from.x, from.y, 'click');

  setTimeout(() => {
    fireEvent(to.x, to.y, 'pointerdown');
    fireEvent(to.x, to.y, 'pointerup');
    fireEvent(to.x, to.y, 'mousedown');
    fireEvent(to.x, to.y, 'mouseup');
    fireEvent(to.x, to.y, 'click');

    if (move[4]) {
      setTimeout(() => {
        const pm = { q:'queen', r:'rook', b:'bishop', n:'knight' };
        const name = pm[move[4]];
        const sels = [
          `.promotion-window [class*="${name}"]`,
          `[class*="promotion"] [class*="${name}"]`,
          `[class*="${name}"]`
        ];
        for (const s of sels) {
          const el = document.querySelector(s);
          if (el && !el.closest('.cc-panel')) { el.click(); break; }
        }
      }, 400);
    }
  }, 80);

  setTimeout(() => {
    if (panel) panel.style.pointerEvents = prevPE || '';
  }, 700);

  const display = document.getElementById('cc-best-move');
  if (display) {
    display.classList.remove('autoplayed');
    void display.offsetWidth;
    display.classList.add('autoplayed');
  }

  return true;
}

function scheduleAutoPlay(move, fenAtAnalysis) {
  clearTimeout(autoPlayTimer);
  if (!autoPlayEnabled || !move) return;
  autoPlayTimer = setTimeout(() => {
    if (!autoPlayEnabled || !hackRunning || isExecutingMove) return;
    if (move !== lastBestMove) return;
    if (currentFenString !== fenAtAnalysis) return;
    isExecutingMove = true;
    const ok = executeMove(move);
    if (ok) {
      playBeep(880, 0.1, 0.06);
      pushHistory(move, currentEvalCp);
    }
    setTimeout(() => { isExecutingMove = false; }, 600);
  }, autoPlayDelay);
}

const LINE_COLORS = ['#4ade80', '#079de8', '#f59e0b'];

function updateMultiLineUI() {
  const container = document.getElementById('cc-multiline');
  if (!container) return;
  if (!multiPVEnabled || multiPVLines.length === 0) {
    container.style.display = 'none';
    container.innerHTML = '';
    return;
  }
  container.style.display = 'flex';
  container.innerHTML = multiPVLines.map((ln, i) => {
    if (!ln || !ln.move) return '';
    const sc = ln.eval !== undefined
      ? (ln.eval >= 9999 ? 'M#' : ln.eval <= -9999 ? '-M#' : (ln.eval / 100).toFixed(2))
      : '?';
    const fmt = `${ln.move.substring(0,2)} → ${ln.move.substring(2,4)}`;
    return `<div class="cc-line-item" data-move="${ln.move}" title="play ${ln.move}">
      <div class="cc-line-dot" style="background:${LINE_COLORS[i]||'#555'}"></div>
      <span class="cc-line-move">${fmt}</span>
      <span class="cc-line-eval">${sc}</span>
    </div>`;
  }).join('');
  container.querySelectorAll('.cc-line-item').forEach(item => {
    item.addEventListener('click', () => {
      const mv = item.getAttribute('data-move');
      if (mv) {
        isExecutingMove = true;
        const ok = executeMove(mv);
        if (ok) { playBeep(880, 0.1, 0.06); pushHistory(mv, currentEvalCp); }
        setTimeout(() => { isExecutingMove = false; }, 600);
      }
    });
  });
}

function pushHistory(move, evalCp) {
  if (!move) return;
  const evalStr = evalCp >= 9999 ? 'M#' : evalCp <= -9999 ? '-M#' : (evalCp/100).toFixed(2);
  moveHistory.unshift({ move, eval: evalStr });
  if (moveHistory.length > 20) moveHistory.pop();
  updateHistoryUI();
}

function updateHistoryUI() {
  const el = document.getElementById('cc-history');
  if (!el) return;
  el.innerHTML = moveHistory.map(h => `
    <div class="cc-history-item" data-move="${h.move}">
      <span class="cc-history-move">${h.move.substring(0,2)} → ${h.move.substring(2,4)}</span>
      <span class="cc-history-eval">${h.eval}</span>
    </div>
  `).join('');
  el.querySelectorAll('.cc-history-item').forEach(item => {
    item.addEventListener('click', () => {
      const mv = item.getAttribute('data-move');
      if (mv) { isExecutingMove = true; executeMove(mv); setTimeout(() => { isExecutingMove = false; }, 600); }
    });
  });
}

function updateEvalGraph() {
  const line = document.getElementById('cc-evalgraph-line');
  if (!line) return;
  if (evalHistory.length < 2) { line.setAttribute('points', ''); return; }
  const max = 100, min = -100;
  const width = 100, height = 30;
  const points = evalHistory.map((v, i) => {
    const x = (i / (evalHistory.length - 1)) * width;
    const clamped = Math.max(min, Math.min(max, v));
    const y = height - ((clamped - min) / (max - min)) * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
  line.setAttribute('points', points);
}

function qualityFromEvalDelta(delta) {
  if (delta >= -20) return '';
  if (delta >= -50) return 'good';
  if (delta >= -100) return 'inaccuracy';
  if (delta >= -200) return 'mistake';
  return 'blunder';
}

function updateQualityBadge(quality) {
  const badge = document.getElementById('cc-quality');
  if (!badge) return;
  badge.className = 'cc-quality';
  if (!quality) return;
  badge.classList.add('show', quality);
  badge.textContent = quality.toUpperCase();
}

function updateUIState(isRunning) {
  const btn        = document.getElementById('cc-toggle-btn');
  const status     = document.getElementById('cc-status');
  const statusText = document.getElementById('cc-status-text');
  const bestMove   = document.getElementById('cc-best-move');
  const playNow    = document.getElementById('cc-play-now');

  if (isRunning) {
    btn.classList.replace('start', 'stop');
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
      </svg>
      <span id="cc-toggle-text">Stop Analysis</span>`;
    status.classList.add('active');
    statusText.textContent = 'Active';
    bestMove.classList.remove('ready');
    bestMove.classList.add('calculating');
    bestMove.textContent = 'Calculating...';
    if (playNow) playNow.disabled = true;
  } else {
    btn.classList.replace('stop', 'start');
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
      <span id="cc-toggle-text">Start Analysis</span>`;
    status.classList.remove('active');
    statusText.textContent = 'Ready';
    bestMove.classList.remove('calculating', 'ready');
    bestMove.textContent = 'Waiting...';
    if (playNow) playNow.disabled = true;
    multiPVLines = [];
    updateMultiLineUI();
  }
}

function clearHighlights() {
  document.querySelectorAll('.cheat-highlight').forEach(e => e.remove());
}

function applyHighlights(from, to, boardFlipped) {
  clearHighlights();
  if (!hintsEnabled) return;
  const chessboard = document.querySelector('wc-chess-board');
  if (!chessboard) return;

  let fx = from[0], fy = from[1], tx = to[0], ty = to[1];
  if (boardFlipped) { fx = 9-fx; fy = 9-fy; tx = 9-tx; ty = 9-ty; }

  const mk = (l, t, cls) => {
    const el = document.createElement('div');
    el.className = `highlight cheat-highlight ${cls}`;
    el.style.cssText = `left:${(l-1)*12.5}%;top:${(8-t)*12.5}%;width:12.5%;height:12.5%;opacity:0;`;
    chessboard.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = '1'; });
  };
  mk(fx, fy, 'from-square');
  mk(tx, ty, 'to-square');

  const arrowIndicator = document.getElementById('cc-arrow-indicator');
  const fromSq = document.getElementById('cc-from-square');
  const toSq   = document.getElementById('cc-to-square');
  if (arrowIndicator && fromSq && toSq) {
    const files = ['a','b','c','d','e','f','g','h'];
    fromSq.textContent = files[from[0]-1] + from[1];
    toSq.textContent   = files[to[0]-1]   + to[1];
    arrowIndicator.style.display = 'flex';
  }
}

function updateEvalBar(evalScore, sideToMove) {
  sideToMove = sideToMove || 'w';
  const fill  = document.getElementById('cc-eval-fill');
  const value = document.getElementById('cc-eval-value');
  if (!fill || !value) return;
  const white = sideToMove === 'b' ? -evalScore : evalScore;
  const pct   = 50 + (Math.max(-10, Math.min(10, white)) / 10) * 50;
  fill.style.width = `${pct}%`;
  value.textContent = white > 0 ? `+${white.toFixed(1)}` : white.toFixed(1);
}

function updateClockUI() {
  const whiteEl = document.getElementById('cc-clock-white');
  const blackEl = document.getElementById('cc-clock-black');
  if (!whiteEl || !blackEl) return;
  const side = getSideToMove();
  whiteEl.classList.toggle('active', side === 'w');
  blackEl.classList.toggle('active', side === 'b');
}

function getFenString() {
  const chessboard = document.querySelector('wc-chess-board');
  if (!chessboard) return null;
  const pieces = chessboard.querySelectorAll('.piece');
  if (!pieces.length) return null;

  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  const flipped = isPlayerBlackGlobal;

  for (const piece of pieces) {
    const cls = Array.from(piece.classList);
    const colorPiece = cls.find(c => /^[wb][pnbrqk]$/.test(c));
    const square     = cls.find(c => /^square-\d+$/.test(c));
    if (!colorPiece || !square) continue;

    const numMatch = square.match(/square-(\d+)/);
    if (!numMatch) continue;
    const idx = parseInt(numMatch[1]);

    let file = idx % 8;
    let rank = Math.floor(idx / 8);

    let fileNum, rankNum;
    if (square.startsWith('square-')) {
      fileNum = (idx % 8) + 1;
      rankNum = Math.floor(idx / 8) + 1;
      file = fileNum - 1;
      rank = rankNum - 1;
    }

    if (flipped) { file = 7 - file; rank = 7 - rank; }

    const pieceMap = {
      wp:'P',wn:'N',wb:'B',wr:'R',wq:'Q',wk:'K',
      bp:'p',bn:'n',bb:'b',br:'r',bq:'q',bk:'k'
    };
    if (file >= 0 && file < 8 && rank >= 0 && rank < 8)
      board[7-rank][file] = pieceMap[colorPiece] || null;
  }

  let fen = '';
  for (let r = 0; r < 8; r++) {
    let empty = 0;
    for (let f = 0; f < 8; f++) {
      if (board[r][f]) { if (empty) { fen += empty; empty = 0; } fen += board[r][f]; }
      else empty++;
    }
    if (empty) fen += empty;
    if (r < 7) fen += '/';
  }
  return fen;
}

function getSideToMove() {
  const clockTop    = document.querySelector('.clock-top, .clock.cw-top, [class*="clock-top"]');
  const clockBottom = document.querySelector('.clock-bottom, .clock.cw-bottom, [class*="clock-bottom"]');
  if (clockTop && clockBottom) {
    if (clockTop.classList.contains('active')    || clockTop.classList.contains('clock-running'))    return 'w';
    if (clockBottom.classList.contains('active') || clockBottom.classList.contains('clock-running')) return 'b';
  }
  const turnText = document.querySelector('[class*="turn"], [data-turn]');
  if (turnText) {
    const t = turnText.getAttribute('data-turn') || turnText.textContent;
    if (t && t.toLowerCase().indexOf('white') !== -1) return 'w';
    if (t && t.toLowerCase().indexOf('black') !== -1) return 'b';
  }
  return 'w';
}

function requestEngineAnalysis() {
  if (!engine || !currentFenString) return;
  for (const k in pvAccum) delete pvAccum[k];
  engine.postMessage(`setoption name MultiPV value ${multiPVEnabled ? 3 : 1}`);
  engine.postMessage(`setoption name Threads value ${engineThreads}`);
  engine.postMessage(`setoption name Hash value ${engineHash}`);
  engine.postMessage(`position fen ${currentFenString}`);
  engine.postMessage(`go depth ${globalDepth}`);
}

function startAnalysis() {
  const chessboard = document.querySelector('wc-chess-board');
  if (!chessboard) return { status: false, error: 'Chess board not found. Make sure you are on chess.com' };

  isPlayerBlackGlobal = false;
  if (chessboard.classList.contains('flipped'))               isPlayerBlackGlobal = true;
  if (chessboard.getAttribute('data-color')   === 'black')    isPlayerBlackGlobal = true;
  if (chessboard.getAttribute('orientation')  === 'black')    isPlayerBlackGlobal = true;
  if (Array.from(chessboard.classList).some(c => c.includes('is-black'))) isPlayerBlackGlobal = true;

  var player_colour = isPlayerBlackGlobal ? 'b' : 'w';

  const playerIndicator = document.getElementById('cc-player-indicator');
  const colorText = playerIndicator && playerIndicator.querySelector('.cc-color-text');
  const pieceIcon = playerIndicator && playerIndicator.querySelector('.cc-piece');
  if (playerIndicator && colorText && pieceIcon) {
    playerIndicator.classList.remove('white', 'black');
    if (isPlayerBlackGlobal) {
      playerIndicator.classList.add('black');
      pieceIcon.textContent  = '♚';
      colorText.textContent  = 'Black';
    } else {
      playerIndicator.classList.add('white');
      pieceIcon.textContent  = '♔';
      colorText.textContent  = 'White';
    }
  }

  const startingFenPart = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
  const initialFenPart  = getFenString();
  if (!initialFenPart) return { status: false, error: 'Could not read board position.' };

  var currentSideToMove = initialFenPart === startingFenPart ? 'w' : player_colour;
  currentFenString  = initialFenPart + ' ' + currentSideToMove;
  currentSideGlobal = currentSideToMove;

  if (engine) engine.terminate();

  try {
    engine = new Worker('/bundles/app/js/vendor/jschessengine/stockfish.asm.1abfa10c.js');
  } catch (e) {
    return { status: false, error: 'Stockfish could not be started on this page.' };
  }

  engine.onmessage = function (event) {
    const data = event.data;
    if (typeof data !== 'string') return;

    if (data.startsWith('info') && data.includes('score')) {
      const cpMatch   = data.match(/score cp (-?\d+)/);
      const mateMatch = data.match(/score mate (-?\d+)/);
      const pvMatch   = data.match(/ pv ([a-h][1-8][a-h][1-8][qrnb]?)/);
      const mpvMatch  = data.match(/multipv (\d+)/);

      let sc = null;
      if (cpMatch)   sc = parseInt(cpMatch[1]);
      if (mateMatch) sc = parseInt(mateMatch[1]) > 0 ? 99999 : -99999;

      if (sc !== null && pvMatch) {
        const idx = mpvMatch ? parseInt(mpvMatch[1]) - 1 : 0;
        pvAccum[idx] = { move: pvMatch[1], eval: sc };
        if (multiPVEnabled) {
          const keys = Object.keys(pvAccum).map(Number).sort((a,b)=>a-b);
          multiPVLines = keys.map(k => pvAccum[k]).slice(0, 3);
          updateMultiLineUI();
        }
      }

      if (cpMatch) {
        currentEvalCp = parseInt(cpMatch[1]);
        updateEvalBar(currentEvalCp / 100, currentSideToMove);
        evalHistory.push(currentEvalCp);
        if (evalHistory.length > 40) evalHistory.shift();
        updateEvalGraph();
      }
    }

    if (data.startsWith('bestmove')) {
      const bestMove = data.split(' ')[1];
      if (!bestMove || bestMove === '(none)') return;
      lastBestMove = bestMove;

      const display = document.getElementById('cc-best-move');
      if (display) {
        display.textContent = `${bestMove.substring(0,2)} → ${bestMove.substring(2,4)}`;
        display.classList.remove('calculating');
        display.classList.add('ready');
      }

      const playNow = document.getElementById('cc-play-now');
      if (playNow) playNow.disabled = false;

      const q = qualityFromEvalDelta(currentEvalCp - lastEvalCp);
      updateQualityBadge(q);
      if (q === 'blunder' && blunderAlert && Date.now() - lastBlunderBeep > 3000) {
        playBlunderSound();
        lastBlunderBeep = Date.now();
      }
      lastEvalCp = currentEvalCp;

      const charMap = { a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8 };
      if (bestMove.length >= 4) {
        const from = [charMap[bestMove[0]], parseInt(bestMove[1])];
        const to   = [charMap[bestMove[2]], parseInt(bestMove[3])];
        applyHighlights(from, to, isPlayerBlackGlobal);
      }

      if (autoPlayEnabled && hackRunning) {
        const isMyTurn = (currentSideToMove === 'w' && !isPlayerBlackGlobal) ||
                         (currentSideToMove === 'b' && isPlayerBlackGlobal);
        if (isMyTurn) {
          pendingAutoPlayFen = currentFenString;
          scheduleAutoPlay(bestMove, pendingAutoPlayFen);
        }
      }
    }
  };

  requestEngineAnalysis();

  getPlays = setInterval(() => {
    updateClockUI();
    const newFenPart = getFenString();
    if (!newFenPart) return;

    const fenParts  = newFenPart.split('/');
    const isValid   = fenParts.length === 8 && fenParts.every(function(rank) {
      let count = 0;
      for (const c of rank) {
        if ('12345678'.indexOf(c) !== -1) count += parseInt(c);
        else if ('rnbqkpRNBQKP'.indexOf(c) !== -1) count += 1;
      }
      return count === 8;
    });
    if (!isValid) return;

    const new_fen = newFenPart + ' ' + currentSideToMove;
    if (new_fen !== currentFenString) {
      currentSideToMove = currentSideToMove === 'w' ? 'b' : 'w';
      currentSideGlobal = currentSideToMove;
      currentFenString  = newFenPart + ' ' + currentSideToMove;

      clearTimeout(autoPlayTimer);
      pendingAutoPlayFen = null;
      updateQualityBadge('');

      const display = document.getElementById('cc-best-move');
      if (display) {
        display.textContent = 'Analyzing...';
        display.classList.add('calculating');
        display.classList.remove('ready');
      }
      const arrowIndicator = document.getElementById('cc-arrow-indicator');
      if (arrowIndicator) arrowIndicator.style.display = 'none';
      const playNow = document.getElementById('cc-play-now');
      if (playNow) playNow.disabled = true;

      clearHighlights();
      multiPVLines = [];
      updateMultiLineUI();
      requestEngineAnalysis();
    }
  }, 200);

  return { status: true };
}

function stopAnalysis() {
  hackRunning = false;
  clearTimeout(autoPlayTimer);
  pendingAutoPlayFen = null;
  if (getPlays) { clearInterval(getPlays); getPlays = null; }
  if (engine)   { engine.terminate(); engine = null; }
  clearHighlights();
  lastBestMove = null;
  multiPVLines = [];
  for (const k in pvAccum) delete pvAccum[k];
  updateQualityBadge('');
}

function setupPanelDrag(panel) {
  const header = panel.querySelector('.cc-header');
  if (!header) return;
  let drag = null;
  header.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('.cc-icon-btn')) return;
    e.preventDefault();
    const rect = panel.getBoundingClientRect();
    drag = { startX: e.clientX, startY: e.clientY, startLeft: rect.left, startTop: rect.top };
    panel.style.transition = 'none';
    panel.style.left = rect.left + 'px'; panel.style.top = rect.top + 'px';
    panel.style.right = 'auto'; panel.style.bottom = 'auto';
    if (header.setPointerCapture) header.setPointerCapture(e.pointerId);
  });
  header.addEventListener('pointermove', (e) => {
    if (!drag) return;
    panel.style.left = Math.max(0, Math.min(window.innerWidth  - panel.offsetWidth,  drag.startLeft + e.clientX - drag.startX)) + 'px';
    panel.style.top  = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, drag.startTop  + e.clientY - drag.startY)) + 'px';
  });
  const stop = (e) => { if (!drag) return; panel.style.transition = ''; drag = null; try { header.releasePointerCapture(e.pointerId); } catch (err) {} };
  header.addEventListener('pointerup',     stop);
  header.addEventListener('pointercancel', stop);
}

function setupPanelResize(panel) {
  const handle = document.getElementById('cc-resize-handle');
  if (!handle) return;
  let resizing = false;
  let startX = 0;
  let startWidth = 0;
  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    resizing = true;
    startX = e.clientX;
    startWidth = panel.offsetWidth;
    try { handle.setPointerCapture(e.pointerId); } catch (err) {}
  });
  handle.addEventListener('pointermove', (e) => {
    if (!resizing) return;
    const delta = startX - e.clientX;
    const newWidth = Math.max(240, Math.min(700, startWidth + delta));
    panel.style.width = newWidth + 'px';
  });
  const stop = (e) => { resizing = false; try { handle.releasePointerCapture(e.pointerId); } catch (err) {} };
  handle.addEventListener('pointerup', stop);
  handle.addEventListener('pointercancel', stop);
}

function showASCIISplash() {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:#000;z-index:9999999;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Courier New,monospace;color:#079de8;overflow:hidden;';

  const pre = document.createElement('pre');
  pre.style.cssText = 'font-size:3px;line-height:1;color:#079de8;text-shadow:0 0 8px #079de8;margin:0;white-space:pre;overflow:hidden;';
  pre.textContent = ASCII_ART;

  const label = document.createElement('div');
  label.style.cssText = 'margin-top:20px;font-size:14px;font-weight:700;letter-spacing:4px;color:#079de8;text-shadow:0 0 16px #079de8;';
  label.textContent = 'NEVERCHESS · BY BUTIZADA';

  const sub = document.createElement('div');
  sub.style.cssText = 'margin-top:8px;font-size:10px;color:#8294a9;letter-spacing:2px;';
  sub.textContent = 'Loading Stockfish engine...';

  overlay.appendChild(pre);
  overlay.appendChild(label);
  overlay.appendChild(sub);
  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.style.transition = 'opacity .6s ease';
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 650);
  }, 2400);
}

function initialize() {
  showASCIISplash();
  injectStyles();

  ensureMusicRunning();
  setTimeout(ensureMusicRunning, 500);

  const existing = document.getElementById('cc-panel');
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.id        = 'cc-panel';
  panel.className = 'cc-panel';
  panel.innerHTML = createPanelHTML();

  const mainBody = document.querySelector('.board-layout-main');
  if (mainBody) mainBody.prepend(panel); else document.body.appendChild(panel);
  setupPanelDrag(panel);
  setupPanelResize(panel);

  const toggleBtn    = document.getElementById('cc-toggle-btn');
  const depthSlider  = document.getElementById('cc-depth-slider');
  const depthDisplay = document.getElementById('cc-depth-display');
  const sliderFill   = document.getElementById('cc-slider-fill');
  const autoToggle   = document.getElementById('cc-autoplay-toggle');
  const multiToggle  = document.getElementById('cc-multiline-toggle');
  const autoFlipTgl  = document.getElementById('cc-autoflip-toggle');
  const blunderTgl   = document.getElementById('cc-blunder-toggle');
  const delaySlider  = document.getElementById('cc-delay-slider');
  const delayVal     = document.getElementById('cc-delay-val');
  const playNow      = document.getElementById('cc-play-now');
  const collapseBtn  = document.getElementById('cc-collapse-btn');
  const miniBtn      = document.getElementById('cc-mini-btn');
  const musicBtn     = document.getElementById('cc-music-btn');
  const copyFenBtn   = document.getElementById('cc-copy-fen');
  const hintsBtn     = document.getElementById('cc-hints-toggle');
  const soundBtn     = document.getElementById('cc-sound-toggle');
  const flipBtn      = document.getElementById('cc-flip-btn');
  const copyPgnBtn   = document.getElementById('cc-copy-pgn');
  const loadFenBtn   = document.getElementById('cc-load-fen');
  const fenInput     = document.getElementById('cc-fen-input');
  const advanced     = document.getElementById('cc-advanced');
  const advancedHdr  = document.getElementById('cc-advanced-header');
  const threadsSld   = document.getElementById('cc-threads-slider');
  const threadsVal   = document.getElementById('cc-threads-val');
  const hashSld      = document.getElementById('cc-hash-slider');
  const hashVal      = document.getElementById('cc-hash-val');
  const musicVolSld  = document.getElementById('cc-music-vol-slider');
  const musicVolVal  = document.getElementById('cc-music-vol-val');
  const presetBtns   = panel.querySelectorAll('.cc-preset-btn');

  if (musicEnabled) musicBtn.classList.add('active');
  autoFlipTgl.checked = autoFlipEnabled;
  blunderTgl.checked = blunderAlert;
  hintsBtn.classList.toggle('active', hintsEnabled);
  hintsBtn.textContent = hintsEnabled ? 'Hints On' : 'Hints Off';
  soundBtn.classList.toggle('active', soundEnabled);
  soundBtn.textContent = soundEnabled ? 'Sound On' : 'Sound Off';
  delaySlider.value = autoPlayDelay;
  delayVal.textContent = autoPlayDelay + 'ms';

  collapseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    const isCollapsed = panel.classList.toggle('collapsed');
    collapseBtn.textContent = isCollapsed ? '▸' : '▾';
    collapseBtn.title = isCollapsed ? 'Expand' : 'Collapse';
  });

  miniBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    miniMode = !miniMode;
    panel.classList.toggle('mini', miniMode);
    if (miniMode) panel.classList.remove('collapsed');
    miniBtn.classList.toggle('active', miniMode);
    miniBtn.textContent = miniMode ? '▬' : '▭';
  });

  musicBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    musicEnabled = !musicEnabled;
    if (musicEnabled) { startMusic(); ensureMusicRunning(); }
    else stopMusic();
    musicBtn.classList.toggle('active', musicEnabled);
    saveSettings();
  });

  toggleBtn.addEventListener('click', () => {
    if (hackRunning) {
      stopAnalysis();
      hackRunning = false;
      updateUIState(false);
    } else {
      toggleBtn.disabled = true;
      toggleBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32"><animate attributeName="stroke-dashoffset" dur="1s" values="32;0" repeatCount="indefinite"/></circle></svg><span>Starting...</span>';
      setTimeout(() => {
        const result = startAnalysis();
        if (result.status) { hackRunning = true; updateUIState(true); }
        else alert(result.error);
        toggleBtn.disabled = false;
      }, 500);
    }
  });

  depthSlider.addEventListener('input', (e) => {
    globalDepth = parseInt(e.target.value);
    depthDisplay.textContent = globalDepth;
    sliderFill.style.width   = `${(globalDepth/40)*100}%`;
    presetBtns.forEach(b => b.classList.toggle('active', parseInt(b.getAttribute('data-depth')) === globalDepth));
    if (hackRunning) requestEngineAnalysis();
    saveSettings();
  });

  presetBtns.forEach(b => b.addEventListener('click', () => {
    globalDepth = parseInt(b.getAttribute('data-depth'));
    depthSlider.value = globalDepth;
    depthDisplay.textContent = globalDepth;
    sliderFill.style.width = `${(globalDepth/40)*100}%`;
    presetBtns.forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    if (hackRunning) requestEngineAnalysis();
    saveSettings();
  }));

  autoToggle.addEventListener('change', (e) => {
    autoPlayEnabled = e.target.checked;
    if (!autoPlayEnabled) { clearTimeout(autoPlayTimer); pendingAutoPlayFen = null; }
  });

  multiToggle.addEventListener('change', (e) => {
    multiPVEnabled = e.target.checked;
    if (!multiPVEnabled) { multiPVLines = []; updateMultiLineUI(); }
    if (hackRunning) requestEngineAnalysis();
  });

  autoFlipTgl.addEventListener('change', (e) => {
    autoFlipEnabled = e.target.checked;
    if (autoFlipEnabled && isPlayerBlackGlobal) {
      const flipEl = document.querySelector('.flip-board-button, [data-cy="flip-board"], .board-flip');
      if (flipEl) flipEl.click();
    }
    saveSettings();
  });

  blunderTgl.addEventListener('change', (e) => {
    blunderAlert = e.target.checked;
    saveSettings();
  });

  delaySlider.addEventListener('input', (e) => {
    autoPlayDelay = parseInt(e.target.value);
    delayVal.textContent = autoPlayDelay + 'ms';
    saveSettings();
  });

  playNow.addEventListener('click', () => {
    if (lastBestMove) {
      isExecutingMove = true;
      const ok = executeMove(lastBestMove);
      if (ok) { playBeep(880, 0.1, 0.06); pushHistory(lastBestMove, currentEvalCp); }
      setTimeout(() => { isExecutingMove = false; }, 600);
    }
  });

  copyFenBtn.addEventListener('click', async () => {
    if (!currentFenString) return;
    try {
      await navigator.clipboard.writeText(currentFenString);
      copyFenBtn.classList.add('copied');
      copyFenBtn.textContent = 'Copied!';
      setTimeout(() => { copyFenBtn.classList.remove('copied'); copyFenBtn.textContent = 'Copy FEN'; }, 1200);
    } catch (e) {}
  });

  hintsBtn.addEventListener('click', () => {
    hintsEnabled = !hintsEnabled;
    hintsBtn.classList.toggle('active', hintsEnabled);
    hintsBtn.textContent = hintsEnabled ? 'Hints On' : 'Hints Off';
    if (!hintsEnabled) {
      clearHighlights();
      const ai = document.getElementById('cc-arrow-indicator');
      if (ai) ai.style.display = 'none';
    } else if (lastBestMove && lastBestMove.length >= 4) {
      const cm = { a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8 };
      applyHighlights(
        [cm[lastBestMove[0]], parseInt(lastBestMove[1])],
        [cm[lastBestMove[2]], parseInt(lastBestMove[3])],
        isPlayerBlackGlobal
      );
    }
    saveSettings();
  });

  soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundBtn.classList.toggle('active', soundEnabled);
    soundBtn.textContent = soundEnabled ? 'Sound On' : 'Sound Off';
    if (soundEnabled) playBeep(880, 0.15, 0.08);
    saveSettings();
  });

  flipBtn.addEventListener('click', () => {
    const flipEl = document.querySelector('.flip-board-button, [data-cy="flip-board"], .board-flip, button[aria-label*="flip"]');
    if (flipEl) flipEl.click();
    else {
      const cb = document.querySelector('wc-chess-board');
      if (cb) {
        const r = cb.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const el = document.elementFromPoint(cx, cy);
        if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    }
    setTimeout(() => {
      const cb = document.querySelector('wc-chess-board');
      if (cb) {
        const isFlipped = cb.classList.contains('flipped') || cb.getAttribute('data-orientation') === 'black' || cb.getAttribute('orientation') === 'black';
        isPlayerBlackGlobal = isFlipped;
      }
      if (hackRunning) {
        const newFen = getFenString();
        if (newFen) { currentFenString = newFen + ' ' + currentSideToMove; requestEngineAnalysis(); }
      }
    }, 300);
  });

  copyPgnBtn.addEventListener('click', async () => {
    if (moveHistory.length === 0) return;
    const pgn = moveHistory.slice().reverse().map(function(h, i) {
      const num = Math.floor(i / 2) + 1;
      return (i % 2 === 0 ? num + '. ' : '') + h.move;
    }).join(' ');
    try {
      await navigator.clipboard.writeText(pgn);
      copyPgnBtn.classList.add('copied');
      copyPgnBtn.textContent = 'Copied!';
      setTimeout(() => { copyPgnBtn.classList.remove('copied'); copyPgnBtn.textContent = 'Export PGN'; }, 1200);
    } catch (e) {}
  });

  loadFenBtn.addEventListener('click', () => {
    fenInput.style.display = fenInput.style.display === 'none' ? 'block' : 'none';
    if (fenInput.style.display === 'block') fenInput.focus();
  });

  fenInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const fen = fenInput.value.trim();
    if (!fen) return;
    const parts = fen.split(' ');
    if (parts.length >= 1) {
      currentFenString = fen;
      currentSideToMove = parts[1] || 'w';
      if (hackRunning) requestEngineAnalysis();
    }
    fenInput.value = '';
    fenInput.style.display = 'none';
  });

  advancedHdr.addEventListener('click', () => {
    advanced.classList.toggle('open');
  });

  threadsSld.addEventListener('input', (e) => {
    engineThreads = parseInt(e.target.value);
    threadsVal.textContent = engineThreads;
    if (hackRunning) requestEngineAnalysis();
    saveSettings();
  });

  hashSld.addEventListener('input', (e) => {
    engineHash = parseInt(e.target.value);
    hashVal.textContent = engineHash;
    if (hackRunning) requestEngineAnalysis();
    saveSettings();
  });

  musicVolSld.addEventListener('input', (e) => {
    const v = parseInt(e.target.value);
    musicVolVal.textContent = v + '%';
    musicVolume = v / 100;
    if (musicGain) musicGain.gain.value = musicVolume;
    saveSettings();
  });

  document.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    const k = e.key.toLowerCase();
    if (k === 'c') { collapseBtn.click(); }
    else if (k === 'm') { musicBtn.click(); }
    else if (k === 's') { toggleBtn.click(); }
    else if (k === 'f') { flipBtn.click(); }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}