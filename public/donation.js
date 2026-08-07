const SUPABASE_URL = "https://nlewibtibgbjwqzytphy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Bqo0Gwutf6yKo8ToA53gwg_eiZHMXYe";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let playerKey = localStorage.getItem("playerKey");
if (!playerKey) {
    playerKey = crypto.randomUUID();
    localStorage.setItem("playerKey", playerKey);
}

const playerKeyDisplay = document.getElementById("playerKeyDisplay");
const ownerDashboardBtn = document.getElementById("ownerDashboardBtn");

function renderPlayerKey() {
    playerKeyDisplay.textContent = playerKey;
}
renderPlayerKey();

async function updateOwnerButton() {
    const { data, error } = await supabaseClient.rpc("check_owner_key", { input_key: playerKey });
    ownerDashboardBtn.style.display = (!error && data === true) ? "block" : "none";
}
updateOwnerButton();

let coins = 0;
let coinsPerClick = 1;
let coinsPerSecond = 0;

const clickUpgrades = [
    { id: "heart", name: "Generous Heart", desc: "+1 coin per click", icon: "🤲", baseCost: 25, add: 1, owned: 0 },
    { id: "match", name: "Matching Gift", desc: "+5 coins per click", icon: "🤝", baseCost: 300, add: 5, owned: 0 },
    { id: "drive", name: "Pledge Drive", desc: "+25 coins per click", icon: "📣", baseCost: 3000, add: 25, owned: 0 },
];

const autoUpgrades = [
    { id: "box", name: "Tzedakah Box", desc: "+1 coin / sec", icon: "📦", baseCost: 15, add: 1, owned: 0 },
    { id: "vol", name: "Community Volunteer", desc: "+5 coins / sec", icon: "🙋", baseCost: 100, add: 5, owned: 0 },
    { id: "fund", name: "Synagogue Fund", desc: "+20 coins / sec", icon: "🕍", baseCost: 1200, add: 20, owned: 0 },
    { id: "center", name: "Community Center", desc: "+100 coins / sec", icon: "🏛️", baseCost: 13000, add: 100, owned: 0 },
    { id: "legacy", name: "Legacy Endowment", desc: "+500 coins / sec", icon: "📜", baseCost: 140000, add: 500, owned: 0 },
];

const milestones = [100, 500, 1000, 5000, 10000, 50000, 100000, 500000];
const milestoneMessages = {
    100: "🎉 100 coins donated!",
    500: "🕎 500 coins — the community feels it!",
    1000: "✡ Legendary supporter! 1,000 coins!",
    5000: "🌟 5,000 coins — word is spreading!",
    10000: "📜 10,000 coins — a true patron!",
    50000: "🏛️ 50,000 coins — a whole center funded!",
    100000: "👑 100,000 coins — a heritage keeper!",
    500000: "✡️ 500,000 coins — your name will be remembered!",
};
const reachedMilestones = new Set();

const coinsDisplay = document.getElementById("coins");
const cpsDisplay = document.getElementById("coinsPerSecond");
const message = document.getElementById("message");
const clickButton = document.getElementById("clickButton");
const clickUpgradesEl = document.getElementById("clickUpgrades");
const autoUpgradesEl = document.getElementById("autoUpgrades");

function fmt(n) {
    return Math.floor(n).toLocaleString();
}

function costFor(upgrade) {
    return Math.ceil(upgrade.baseCost * Math.pow(1.15, upgrade.owned));
}

function checkMilestones() {
    for (const m of milestones) {
        if (coins >= m && !reachedMilestones.has(m)) {
            reachedMilestones.add(m);
            message.textContent = milestoneMessages[m];
        }
    }
}

function updateDisplay() {
    coinsDisplay.textContent = "Coins: " + fmt(coins);
    cpsDisplay.textContent = `+${fmt(coinsPerSecond)} coins / sec  ·  +${fmt(coinsPerClick)} per click`;
    renderShop();
}

function buildCard(upgrade, onBuy) {
    const cost = costFor(upgrade);
    const card = document.createElement("button");
    card.className = "upgrade-card";
    card.disabled = coins < cost;
    card.innerHTML = `
        <div class="upgrade-icon">${upgrade.icon}</div>
        <div class="upgrade-info">
            <div class="upgrade-name">${upgrade.name}</div>
            <div class="upgrade-desc">${upgrade.desc}</div>
        </div>
        <div class="upgrade-meta">
            <div class="upgrade-cost">${fmt(cost)} 🪙</div>
            <div class="upgrade-owned">owned: ${upgrade.owned}</div>
        </div>
    `;
    card.onclick = () => onBuy(upgrade);
    return card;
}

function renderShop() {
    clickUpgradesEl.innerHTML = "";
    clickUpgrades.forEach(u => clickUpgradesEl.appendChild(buildCard(u, buyClickUpgrade)));

    autoUpgradesEl.innerHTML = "";
    autoUpgrades.forEach(u => autoUpgradesEl.appendChild(buildCard(u, buyAutoUpgrade)));
}

function buyClickUpgrade(upgrade) {
    const cost = costFor(upgrade);
    if (coins < cost) return;
    coins -= cost;
    upgrade.owned++;
    coinsPerClick += upgrade.add;
    updateDisplay();
}

function buyAutoUpgrade(upgrade) {
    const cost = costFor(upgrade);
    if (coins < cost) return;
    coins -= cost;
    upgrade.owned++;
    coinsPerSecond += upgrade.add;
    updateDisplay();
}

clickButton.addEventListener("click", () => {
    coins += coinsPerClick;
    checkMilestones();
    updateDisplay();
    message.textContent = message.textContent || "+" + coinsPerClick + " Jewish Coin ✡";
});

setInterval(() => {
    if (coinsPerSecond > 0) {
        coins += coinsPerSecond / 10;
        checkMilestones();
        updateDisplay();
    }
}, 100);

updateDisplay();

document.getElementById("saveScoreBtn").addEventListener("click", saveScore);

async function saveScore() {
    const name = document.getElementById("playerName").value.trim();
    if (!name) {
        alert("Enter your name first");
        return;
    }

    const { error } = await supabaseClient
        .from("players")
        .upsert({ id: playerKey, name: name, coins: Math.floor(coins) });

    if (error) {
        console.error(error);
        document.getElementById("leaderboardStatus").textContent = "Could not save score.";
    } else {
        document.getElementById("leaderboardStatus").textContent = "Score saved!";
        loadLeaderboard();
    }
}

async function loadLeaderboard() {
    const { data, error } = await supabaseClient
        .from("players")
        .select("name, coins")
        .order("coins", { ascending: false })
        .limit(10);

    if (error) {
        console.error(error);
        return;
    }

    const list = document.getElementById("leaderboardList");
    list.innerHTML = "";
    data.forEach(player => {
        const li = document.createElement("li");
        li.textContent = `${player.name} — ${fmt(player.coins)} coins`;
        list.appendChild(li);
    });
}

loadLeaderboard();

document.getElementById("restoreKeyBtn").addEventListener("click", async () => {
    const key = document.getElementById("restoreKeyInput").value.trim();
    if (!key) return;

    const { data, error } = await supabaseClient
        .from("players")
        .select("*")
        .eq("id", key)
        .maybeSingle();

    playerKey = key;
    localStorage.setItem("playerKey", key);
    renderPlayerKey();
    updateOwnerButton();

    if (error || !data) {
        document.getElementById("leaderboardStatus").textContent =
            "No saved score found for that key, but it's now your active key.";
        return;
    }

    coins = Number(data.coins);
    document.getElementById("playerName").value = data.name || "";
    updateDisplay();
    document.getElementById("leaderboardStatus").textContent = "Player restored.";
});

const dashboard = document.getElementById("dashboard");
const dashboardStats = document.getElementById("dashboardStats");
const dashboardBody = document.getElementById("dashboardBody");
const resetLeaderboardBtn = document.getElementById("resetLeaderboardBtn");

ownerDashboardBtn.onclick = () => {
    const isOpen = dashboard.style.display === "block";
    dashboard.style.display = isOpen ? "none" : "block";
    if (!isOpen) loadDashboard();
};

async function loadDashboard() {
    const { data, error } = await supabaseClient
        .from("players")
        .select("id, name, coins, role")
        .order("coins", { ascending: false });

    if (error) {
        dashboardStats.textContent = "Couldn't load dashboard data.";
        return;
    }

    const totalCoins = data.reduce((sum, row) => sum + Number(row.coins), 0);
    dashboardStats.innerHTML = `<p>${data.length} supporters · ${fmt(totalCoins)} total coins</p>`;

    dashboardBody.innerHTML = "";
    data.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${row.name || "(no name)"}</td>
            <td>${fmt(row.coins)}</td>
            <td>
                <select class="role-select" data-id="${row.id}">
                    <option value="user" ${row.role === "user" ? "selected" : ""}>user</option>
                    <option value="mod" ${row.role === "mod" ? "selected" : ""}>mod</option>
                    <option value="admin" ${row.role === "admin" ? "selected" : ""}>admin</option>
                </select>
            </td>
            <td class="dashboard-actions">
                <input type="number" class="coin-add-input" data-id="${row.id}" placeholder="amount" />
                <button class="add-coins-btn" data-id="${row.id}">Add</button>
                <button class="zero-coins-btn" data-id="${row.id}">Remove all</button>
                <button class="delete-row-btn" data-id="${row.id}">Delete</button>
            </td>
        `;
        dashboardBody.appendChild(tr);
    });

    dashboardBody.querySelectorAll(".role-select").forEach(sel => {
        sel.onchange = async () => {
            await supabaseClient.from("players").update({ role: sel.value }).eq("id", sel.dataset.id);
        };
    });

    dashboardBody.querySelectorAll(".add-coins-btn").forEach(btn => {
        btn.onclick = async () => {
            const input = dashboardBody.querySelector(`.coin-add-input[data-id="${btn.dataset.id}"]`);
            const amount = Number(input.value);
            if (!amount) return;
            const { data: row } = await supabaseClient
                .from("players")
                .select("coins")
                .eq("id", btn.dataset.id)
                .maybeSingle();
            if (!row) return;
            await supabaseClient
                .from("players")
                .update({ coins: Number(row.coins) + amount })
                .eq("id", btn.dataset.id);
            loadDashboard();
            loadLeaderboard();
        };
    });

    dashboardBody.querySelectorAll(".zero-coins-btn").forEach(btn => {
        btn.onclick = async () => {
            await supabaseClient.from("players").update({ coins: 0 }).eq("id", btn.dataset.id);
            loadDashboard();
            loadLeaderboard();
        };
    });

    dashboardBody.querySelectorAll(".delete-row-btn").forEach(btn => {
        btn.onclick = async () => {
            await supabaseClient.from("players").delete().eq("id", btn.dataset.id);
            loadDashboard();
            loadLeaderboard();
        };
    });
}

resetLeaderboardBtn.onclick = async () => {
    const confirmed = confirm("This deletes every player entry for everyone. Are you sure?");
    if (!confirmed) return;
    await supabaseClient.from("players").delete().not("id", "is", null);
    loadDashboard();
    loadLeaderboard();
};