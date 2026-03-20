/**
 * Retro Stack — Player Badge gating (soulbound ERC-721 on Soneium).
 * Read-only balance checks use JSON-RPC (no ethers). Mint on hub uses ethers if present.
 * Set contractAddress in RETRO_STACK_BADGE_CONFIG after deployment (non-zero = gate active).
 */
(function (global) {
  "use strict";

  var RETRO_STACK_BADGE_CONFIG = {
    contractAddress: "0x007361811aCDe47332de661230d68bA34948A5a5",
    chainId: 1868,
    chainIdHex: "0x74c",
    rpcUrl: "https://rpc.soneium.org",
    mintPriceWei: "500000000000000"
  };

  var BALANCE_OF_SELECTOR = "0x70a08231";

  function padAddr(addr) {
    var a = (addr || "").toLowerCase().replace(/^0x/, "");
    if (a.length !== 40) throw new Error("Invalid address");
    return "000000000000000000000000" + a;
  }

  function encodeBalanceOf(holder) {
    return BALANCE_OF_SELECTOR + padAddr(holder);
  }

  async function rpcCall(to, data) {
    var body = {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to: to.toLowerCase(), data: data }, "latest"]
    };
    var r = await fetch(RETRO_STACK_BADGE_CONFIG.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    var j = await r.json();
    if (j.error) throw new Error(j.error.message || "RPC error");
    return j.result || "0x0";
  }

  function hexToBigInt(hex) {
    if (!hex || hex === "0x") return BigInt(0);
    return BigInt(hex);
  }

  function isGateActive() {
    var a = RETRO_STACK_BADGE_CONFIG.contractAddress;
    return !!(a && /^0x[a-fA-F0-9]{40}$/.test(a) && !/^0x0{40}$/i.test(a));
  }

  async function hasBadge(holderAddress) {
    if (!isGateActive()) return true;
    if (!holderAddress) return false;
    var data = encodeBalanceOf(holderAddress);
    var result = await rpcCall(RETRO_STACK_BADGE_CONFIG.contractAddress, data);
    return hexToBigInt(result) > BigInt(0);
  }

  async function getSignerAddress() {
    var eth = global.ethereum;
    if (!eth) return null;
    var acc = await eth.request({ method: "eth_accounts" });
    if (!acc || !acc.length) return null;
    if (global.ethers && global.ethers.utils && global.ethers.utils.getAddress) {
      return global.ethers.utils.getAddress(acc[0]);
    }
    return acc[0];
  }

  function defaultGameHubUrl() {
    if (global.location && String(global.location.pathname).indexOf("/games/") !== -1) {
      return global.location.origin + "/index.html";
    }
    return global.location.origin + "/";
  }

  function injectOverlayStyles() {
    if (document.getElementById("retro-stack-badge-styles")) return;
    var s = document.createElement("style");
    s.id = "retro-stack-badge-styles";
    s.textContent = [
      "#rs-badge-gate{position:fixed;inset:0;z-index:2147483000;background:rgba(6,8,14,0.55);color:#e8fffa;",
      "display:flex;align-items:center;justify-content:center;font-family:system-ui,Segoe UI,sans-serif;padding:24px;backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);}",
      "#rs-badge-gate .rs-inner{max-width:440px;text-align:center;background:rgba(18,24,38,0.94);border:1px solid rgba(69,255,177,0.4);",
      "border-radius:16px;padding:28px 24px;box-shadow:0 8px 40px rgba(0,0,0,0.45),0 0 32px rgba(60,245,255,0.1);}",
      "#rs-badge-gate h2{margin:0 0 12px;font-size:1.35rem;letter-spacing:0.06em;}",
      "#rs-badge-gate p{margin:0 0 16px;color:#9fb0c3;line-height:1.5;font-size:0.95rem;}",
      "#rs-badge-gate .rs-actions{display:flex;flex-direction:column;gap:10px;}",
      "#rs-badge-gate button,#rs-badge-gate a.rs-btn{cursor:pointer;border:none;border-radius:10px;padding:12px 16px;font-weight:700;font-size:0.95rem;text-decoration:none;text-align:center;display:block;}",
      "#rs-badge-gate .rs-primary{background:linear-gradient(90deg,#45ffb1,#3cf5ff);color:#061018;}",
      "#rs-badge-gate .rs-secondary{background:rgba(255,255,255,0.08);color:#e8fffa;border:1px solid rgba(255,255,255,0.15);}",
      "body.rs-badge-loading{overflow:hidden;}"
    ].join("");
    document.head.appendChild(s);
  }

  function showGateOverlay(mode, opts) {
    opts = opts || {};
    injectOverlayStyles();
    var existing = document.getElementById("rs-badge-gate");
    if (existing) existing.remove();
    var wrap = document.createElement("div");
    wrap.id = "rs-badge-gate";
    var inner = document.createElement("div");
    inner.className = "rs-inner";
    var home = opts.homeUrl || defaultGameHubUrl();
    var mintHash = opts.mintHash || "player-badge";

    if (mode === "no-wallet") {
      inner.innerHTML =
        "<h2>Wallet required</h2><p>Install a wallet (e.g. MetaMask) to connect and verify your <strong>Retro Stack Player Badge</strong> before playing.</p>" +
        '<div class="rs-actions"><a class="rs-btn rs-primary" href="' +
        home +
        "#" +
        mintHash +
        '">Open hub — mint</a></div>';
    } else if (mode === "connect") {
      inner.innerHTML =
        "<h2>Connect wallet</h2><p>Connect the wallet that holds your Player Badge. We only check balance on Soneium — no transaction to play.</p>" +
        '<div class="rs-actions"><button type="button" class="rs-primary" id="rs-gate-connect">Connect wallet</button>' +
        '<a class="rs-btn rs-secondary" href="' +
        home +
        "#" +
        mintHash +
        '">mint</a></div>';
    } else {
      inner.innerHTML =
        "<h2>Badge required</h2><p>This game needs the soulbound <strong>Player Badge</strong> on Soneium (one per wallet). Mint on the hub, then come back — or connect a wallet that already minted.</p>" +
        '<div class="rs-actions"><a class="rs-btn rs-primary" href="' +
        home +
        "#" +
        mintHash +
        '">mint</a>' +
        '<button type="button" class="rs-secondary" id="rs-gate-recheck">I minted — check again</button></div>';
    }
    wrap.appendChild(inner);
    document.body.appendChild(wrap);
    document.body.classList.add("rs-badge-loading");
    return wrap;
  }

  function hideGateOverlay() {
    var g = document.getElementById("rs-badge-gate");
    if (g) g.remove();
    document.body.classList.remove("rs-badge-loading");
  }

  async function initGameGate(options) {
    options = options || {};
    if (!isGateActive()) {
      hideGateOverlay();
      return;
    }
    var homeUrl = options.homeUrl || defaultGameHubUrl();
    var mintHash = options.mintHash || "player-badge";

    if (!global.ethereum) {
      showGateOverlay("no-wallet", { homeUrl: homeUrl, mintHash: mintHash });
      return;
    }
    var addr = await getSignerAddress();
    if (!addr) {
      var wrap = showGateOverlay("connect", { homeUrl: homeUrl, mintHash: mintHash });
      var btn = document.getElementById("rs-gate-connect");
      if (btn) {
        btn.onclick = async function () {
          btn.disabled = true;
          try {
            await global.ethereum.request({ method: "eth_requestAccounts" });
            await initGameGate(options);
          } catch (e) {
            btn.disabled = false;
          }
        };
      }
      return;
    }
    var ok = await hasBadge(addr);
    if (!ok) {
      showGateOverlay("mint", { homeUrl: homeUrl, mintHash: mintHash });
      var recheck = document.getElementById("rs-gate-recheck");
      if (recheck) {
        recheck.onclick = function () {
          initGameGate(options);
        };
      }
      return;
    }
    hideGateOverlay();
    document.body.classList.add("rs-badge-verified");
  }

  async function switchToSoneium(eth) {
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: RETRO_STACK_BADGE_CONFIG.chainIdHex }]
      });
    } catch (e) {
      if (e.code === 4902) {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: RETRO_STACK_BADGE_CONFIG.chainIdHex,
              chainName: "Soneium",
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
              rpcUrls: [RETRO_STACK_BADGE_CONFIG.rpcUrl]
            }
          ]
        });
      } else {
        throw e;
      }
    }
  }

  async function mintBadgeTx() {
    var eth = global.ethereum;
    if (!eth) throw new Error("Install MetaMask");
    if (!global.ethers) throw new Error("Ethers.js required for mint");

    await eth.request({ method: "eth_requestAccounts" });
    await switchToSoneium(eth);

    var provider = new global.ethers.providers.Web3Provider(eth, "any");
    var net = await provider.getNetwork();
    if (Number(net.chainId) !== RETRO_STACK_BADGE_CONFIG.chainId) {
      throw new Error("Please switch to Soneium (Chain ID 1868)");
    }

    var abi = ["function mint() payable"];
    var signer = provider.getSigner();
    var c = new global.ethers.Contract(RETRO_STACK_BADGE_CONFIG.contractAddress, abi, signer);
    var value = global.ethers.BigNumber.from(RETRO_STACK_BADGE_CONFIG.mintPriceWei);
    var tx = await c.mint({ value: value, gasLimit: 250000 });
    await tx.wait();
    return tx.hash;
  }

  async function initHubMintUI() {
    var eth = global.ethereum;
    var statusEl = document.getElementById("rs-badge-mint-status");
    var btn = document.getElementById("rs-badge-mint-btn");
    var checkEl = document.getElementById("rs-badge-status-line");
    if (!btn) return;

    if (!isGateActive()) {
      if (checkEl)
        checkEl.textContent =
          "Badge contract address not set in js/retro-stack-badge.js — access gating is off until you deploy and paste the address.";
      btn.style.display = "none";
      return;
    }

    async function refresh() {
      if (!eth) {
        if (checkEl) checkEl.textContent = "Install a wallet browser extension to mint.";
        btn.textContent = "Install MetaMask";
        btn.disabled = true;
        return;
      }
      var addr = await getSignerAddress();
      if (!addr) {
        if (checkEl) checkEl.textContent = "Connect your wallet to see badge status.";
        btn.textContent = "Connect wallet";
        btn.disabled = false;
        btn.onclick = async function () {
          try {
            await eth.request({ method: "eth_requestAccounts" });
            await refresh();
          } catch (err) {
            console.error(err);
          }
        };
        return;
      }
      var has = await hasBadge(addr);
      if (checkEl) {
        checkEl.textContent = has
          ? "You hold the Player Badge — all games and leaderboard submits are unlocked."
          : "No badge on this wallet yet. Mint below on Soneium (one per wallet).";
      }
      if (has) {
        btn.textContent = "Already minted";
        btn.disabled = true;
        return;
      }
      btn.textContent = "mint";
      btn.disabled = false;
      btn.onclick = async function () {
        btn.disabled = true;
        if (statusEl) statusEl.textContent = "Confirm in wallet…";
        try {
          var hash = await mintBadgeTx();
          if (statusEl) statusEl.textContent = "Minted! Tx: " + hash.slice(0, 18) + "…";
          await refresh();
        } catch (err) {
          console.error(err);
          if (statusEl) statusEl.textContent = err.message || String(err);
          btn.disabled = false;
        }
      };
    }
    refresh();
  }

  function bindPlayGateLink(a, getTargetHref) {
    a.addEventListener(
      "click",
      function (e) {
        if (!isGateActive()) return;
        e.preventDefault();
        var target = getTargetHref();
        (async function () {
          if (!global.ethereum) {
            alert("Install MetaMask to verify your Player Badge.");
            return;
          }
          var addr = await getSignerAddress();
          if (!addr) {
            try {
              await global.ethereum.request({ method: "eth_requestAccounts" });
            } catch (err) {
              return;
            }
            addr = await getSignerAddress();
          }
          if (!addr) return;
          if (!(await hasBadge(addr))) {
            alert("Player Badge required. Open the Retro Stack hub and mint (Player Badge section).");
            global.location.href = defaultGameHubUrl() + "#player-badge";
            return;
          }
          global.location.href = target;
        })();
      },
      true
    );
  }

  function initHubPlayGate() {
    if (!isGateActive()) return;
    document.querySelectorAll("a.btn-play").forEach(function (a) {
      if (a.classList.contains("disabled")) return;
      var href = a.getAttribute("href") || "";
      if (!href || href === "#") return;
      bindPlayGateLink(a, function () {
        return href;
      });
    });
    document.querySelectorAll(".footer-games a[href]").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (!href || href.indexOf("games/") === -1) return;
      bindPlayGateLink(a, function () {
        return a.href;
      });
    });
  }

  async function requireBadgeForSubmit(address) {
    if (!isGateActive()) return;
    if (!address) throw new Error("Connect wallet to submit scores.");
    if (!(await hasBadge(address))) {
      throw new Error(
        "Retro Stack Player Badge required to submit leaderboard scores. Mint at the hub: " + defaultGameHubUrl()
      );
    }
  }

  global.RetroStackBadge = {
    config: RETRO_STACK_BADGE_CONFIG,
    isGateActive: isGateActive,
    hasBadge: hasBadge,
    getSignerAddress: getSignerAddress,
    initGameGate: initGameGate,
    initHubMintUI: initHubMintUI,
    initHubPlayGate: initHubPlayGate,
    mintBadgeTx: mintBadgeTx,
    requireBadgeForSubmit: requireBadgeForSubmit,
    hideGateOverlay: hideGateOverlay
  };
})(typeof window !== "undefined" ? window : this);
