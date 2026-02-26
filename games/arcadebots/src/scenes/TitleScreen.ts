import Phaser from 'phaser';
import { LevelManager } from '../LevelManager.js';
import * as utils from '../utils';
import { walletManager, type WalletState } from '../wallet/WalletManager';
import { contractManager } from '../wallet/ContractManager';

export class TitleScreen extends Phaser.Scene {
  public uiContainer!: Phaser.GameObjects.DOMElement;
  public keydownHandler?: (event: KeyboardEvent) => void;
  public clickHandler?: (event: Event) => void;
  public walletButtonHandler?: (event: Event) => void;
  public backgroundMusic!: Phaser.Sound.BaseSound;
  public isStarting: boolean = false;
  private unsubscribeWallet?: () => void;

  constructor() {
    super({ key: "TitleScreen" });
    this.isStarting = false;
  }

  init(): void {
    this.isStarting = false;
  }

  create(): void {
    this.initializeSounds();
    this.createDOMUI();
    this.setupInputs();
    this.setupWalletConnection();
    this.playBackgroundMusic();

    this.events.once('shutdown', () => {
      this.cleanupEventListeners();
    });
  }

  setupWalletConnection(): void {
    // Subscribe to wallet state changes
    this.unsubscribeWallet = walletManager.subscribe((state: WalletState) => {
      this.updateWalletUI(state);
    });
  }

  updateWalletUI(state: WalletState): void {
    const walletButton = document.getElementById('wallet-connect-btn');
    const walletStatus = document.getElementById('wallet-status');

    if (walletButton && walletStatus) {
      if (state.isConnected && state.address) {
        const shortAddress = walletManager.getShortAddress(state.address);
        walletButton.innerHTML = `
          <span class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full ${state.isCorrectNetwork ? 'bg-green-400' : 'bg-yellow-400'}"></span>
            ${shortAddress}
          </span>
        `;
        walletButton.classList.remove('bg-gradient-to-r', 'from-purple-600', 'to-cyan-500');
        walletButton.classList.add('bg-gray-800', 'border', 'border-cyan-400');

        walletStatus.textContent = state.isCorrectNetwork ? 'Soneium Network' : 'Wrong Network - Click to Switch';
        walletStatus.className = state.isCorrectNetwork
          ? 'text-xs text-green-400 mt-1'
          : 'text-xs text-yellow-400 mt-1 cursor-pointer';
      } else {
        walletButton.innerHTML = `
          <span class="flex items-center gap-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1"/>
              <polyline points="15 11 19 11 19 7"/>
              <path d="M9 7v10"/>
            </svg>
            Connect Wallet
          </span>
        `;
        walletButton.classList.add('bg-gradient-to-r', 'from-purple-600', 'to-cyan-500');
        walletButton.classList.remove('bg-gray-800', 'border', 'border-cyan-400');
        walletStatus.textContent = '';
      }
    }
  }

  async handleWalletConnect(): Promise<void> {
    try {
      const state = walletManager.getState();

      if (state.isConnected && !state.isCorrectNetwork) {
        // Already connected but wrong network - switch network
        await walletManager.switchToSoneium();
      } else if (!state.isConnected) {
        // Not connected - connect wallet
        await walletManager.connect();
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      if (error.message === 'MetaMask is not installed') {
        // Will open MetaMask download page
      }
    }
  }

  createDOMUI(): void {
    const uiHTML = `
      <div id="title-screen-container" class="fixed top-0 left-0 w-full h-full pointer-events-none z-[1000] font-retro flex flex-col justify-between items-center" style="image-rendering: auto; background-image: url('https://cdn-game-mcp.gambo.ai/85b616cb-0f03-4cd0-9068-67934773169d/images/hollow_cave_background.png'); background-size: cover; background-position: center; background-repeat: no-repeat;">
        <!-- Dark overlay -->
        <div class="absolute inset-0 bg-black bg-opacity-40"></div>
        
        <!-- Top Right: Wallet + Leaderboard -->
        <div class="absolute top-4 right-4 z-50 pointer-events-auto flex flex-col items-end gap-2">
          <div class="flex items-center gap-2">
            <button id="leaderboard-btn" class="px-3 py-2 rounded-lg bg-gray-800 border border-cyan-500/50 text-cyan-400 font-bold text-xs hover:bg-gray-700 transition-all" style="font-family: 'Inter', sans-serif;">Leaderboard</button>
            <button id="wallet-connect-btn" class="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-sm hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-cyan-500/30" style="font-family: 'Inter', sans-serif;">
              <span class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                Connect Wallet
              </span>
            </button>
          </div>
          <div id="wallet-status" class="text-xs text-green-400 mt-1" style="font-family: 'Inter', sans-serif;"></div>
        </div>

        <!-- Leaderboard Modal (hidden by default) -->
        <div id="leaderboard-modal" class="absolute inset-0 z-[1001] pointer-events-none opacity-0 flex items-center justify-center transition-opacity duration-200" style="background: rgba(0,0,0,0.75);">
          <div class="pointer-events-auto bg-gray-900 border border-cyan-500/40 rounded-xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-cyan-400 font-bold text-lg" style="font-family: 'Inter', sans-serif;">Arcade Bot Leaderboard</h2>
              <button id="leaderboard-close" class="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <div id="leaderboard-list" class="overflow-y-auto flex-1 text-left text-sm space-y-1" style="font-family: 'Inter', sans-serif;">
              <div class="text-gray-500">Loading...</div>
            </div>
          </div>
        </div>
        
        <!-- Main Content Container -->
        <div class="relative flex flex-col items-center space-y-10 justify-between pt-12 pb-20 w-full text-center pointer-events-auto h-full">
          
          <!-- Game Title Image Container -->
          <div id="game-title-container" class="flex-shrink-0 flex items-center justify-center">
            <img id="game-title-image" 
                 src="https://cdn-game-mcp.gambo.ai/fb0bc11b-62ec-45cf-8642-a67543ae46b4/images/arcade_bot_game_title.png" 
                 alt="Arcade Bot" 
                 class="max-h-[280px] mx-20 object-contain pointer-events-none"
                 style="filter: drop-shadow(4px 4px 8px rgba(0,0,0,0.8));" />
          </div>

          <!-- Spacer -->
          <div class="flex-grow"></div>

          <!-- Press Enter Text -->
          <div id="press-enter-text" class="text-cyan-400 font-bold pointer-events-none flex-shrink-0" style="
            font-size: 36px;
            text-shadow: 3px 3px 0px #000000, 0 0 20px rgba(0,255,255,0.5);
            animation: titleBlink 1s ease-in-out infinite alternate;
          ">PRESS ENTER TO START</div>

        </div>

        <!-- Custom Animations and Styles -->
        <style>
          @keyframes titleBlink {
            from { opacity: 0.3; }
            to { opacity: 1; }
          }
        </style>
      </div>
    `;

    this.uiContainer = utils.initUIDom(this, uiHTML);
  }

  setupInputs(): void {
    const handleStart = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.closest('#wallet-connect-btn') || target.closest('#wallet-status') || target.closest('#leaderboard-btn') || target.closest('#leaderboard-modal')) {
        return;
      }
      event.preventDefault();
      this.startGame();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Enter' || event.code === 'Space') {
        event.preventDefault();
        this.startGame();
      }
    };

    const handleWalletClick = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      this.handleWalletConnect();
    };

    document.addEventListener('keydown', handleKeyDown);

    if (this.uiContainer && this.uiContainer.node) {
      this.uiContainer.node.addEventListener('click', handleStart);

      // Add wallet button listener
      const walletBtn = this.uiContainer.node.querySelector('#wallet-connect-btn');
      if (walletBtn) {
        walletBtn.addEventListener('click', handleWalletClick);
      }

      const walletStatus = this.uiContainer.node.querySelector('#wallet-status');
      if (walletStatus) {
        walletStatus.addEventListener('click', handleWalletClick);
      }

      const leaderboardBtn = this.uiContainer.node.querySelector('#leaderboard-btn');
      if (leaderboardBtn) {
        leaderboardBtn.addEventListener('click', (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          this.showLeaderboard();
        });
      }

      const leaderboardClose = this.uiContainer.node.querySelector('#leaderboard-close');
      const leaderboardModal = this.uiContainer.node.querySelector('#leaderboard-modal');
      if (leaderboardClose && leaderboardModal) {
        leaderboardClose.addEventListener('click', () => this.hideLeaderboard());
        (leaderboardModal as HTMLElement).addEventListener('click', (e: Event) => {
          if ((e.target as HTMLElement).id === 'leaderboard-modal') this.hideLeaderboard();
        });
      }
    }

    this.keydownHandler = handleKeyDown;
    this.clickHandler = handleStart;
    this.walletButtonHandler = handleWalletClick;
  }

  initializeSounds(): void {
    this.backgroundMusic = this.sound.add("cave_exploration_theme", {
      volume: 0.4,
      loop: true
    });
  }

  playBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.play();
    }
  }

  showLeaderboard(): void {
    const modal = this.uiContainer?.node?.querySelector('#leaderboard-modal');
    const listEl = this.uiContainer?.node?.querySelector('#leaderboard-list');
    if (!modal || !listEl) return;
    (listEl as HTMLElement).innerHTML = '<div class="text-gray-500">Loading...</div>';
    (modal as HTMLElement).classList.remove('pointer-events-none', 'opacity-0');
    (modal as HTMLElement).classList.add('pointer-events-auto', 'opacity-100');
    contractManager.getLeaderboardTop(10).then((entries) => {
      if (entries.length === 0) {
        (listEl as HTMLElement).innerHTML = '<div class="text-gray-500">No scores yet. Play and submit to Soneium!</div>';
        return;
      }
      (listEl as HTMLElement).innerHTML = entries
        .map((e, i) => `<div class="flex justify-between py-1 border-b border-gray-700/50"><span class="text-gray-300">${i + 1}. ${e.address.slice(0, 6)}...${e.address.slice(-4)}</span><span class="text-cyan-400 font-bold">${e.score.toLocaleString()}</span></div>`)
        .join('');
    }).catch(() => {
      (listEl as HTMLElement).innerHTML = '<div class="text-red-400">Could not load leaderboard. Connect to Soneium?</div>';
    });
  }

  hideLeaderboard(): void {
    const modal = this.uiContainer?.node?.querySelector('#leaderboard-modal');
    if (!modal) return;
    (modal as HTMLElement).classList.add('pointer-events-none', 'opacity-0');
    (modal as HTMLElement).classList.remove('pointer-events-auto', 'opacity-100');
  }

  startGame(): void {
    if (this.isStarting) return;
    this.isStarting = true;

    // Play click sound
    this.sound.play("ui_click", { volume: 0.5 });

    this.cleanupEventListeners();

    // Don't stop background music - it continues into character select

    this.cameras.main.fadeOut(300, 0, 0, 0);

    this.time.delayedCall(300, () => {
      // Go to character selection screen
      this.scene.start('CharacterSelectScene');
    });
  }

  cleanupEventListeners(): void {
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
    }

    if (this.clickHandler && this.uiContainer && this.uiContainer.node) {
      this.uiContainer.node.removeEventListener('click', this.clickHandler);
    }

    if (this.walletButtonHandler && this.uiContainer && this.uiContainer.node) {
      const walletBtn = this.uiContainer.node.querySelector('#wallet-connect-btn');
      if (walletBtn) {
        walletBtn.removeEventListener('click', this.walletButtonHandler);
      }
    }

    if (this.unsubscribeWallet) {
      this.unsubscribeWallet();
    }
  }

  update(): void {
    // Title screen doesn't need special update logic
  }
}
