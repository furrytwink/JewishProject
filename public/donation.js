// donation.js

const SUPABASE_URL = "https://nlewibtibgbjwqzytphy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Bqo0Gwutf6yKo8ToA53gwg_eiZHMXYe";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// -------------------------
// Player setup
// -------------------------

let playerKey = localStorage.getItem("playerKey");

if (!playerKey) {
    playerKey = crypto.randomUUID();
    localStorage.setItem("playerKey", playerKey);
}

document.getElementById("playerKeyDisplay").textContent = playerKey;


// -------------------------
// Game variables
// -------------------------

let coins = 0;
let coinsPerSecond = 0;
let clickPower = 1;


// -------------------------
// UI
// -------------------------

const coinsDisplay = document.getElementById("coins");
const cpsDisplay = document.getElementById("coinsPerSecond");
const message = document.getElementById("message");

const clickButton = document.getElementById("clickButton");


// -------------------------
// Clicking coins
// -------------------------

clickButton.addEventListener("click", () => {

    coins += clickPower;

    updateDisplay();

    message.textContent = "+1 Jewish Coin ✡";

});



function updateDisplay(){

    coinsDisplay.textContent =
        `Coins: ${Math.floor(coins)}`;

    cpsDisplay.textContent =
        `+${coinsPerSecond} coins / sec`;

}


// -------------------------
// Passive coins
// -------------------------

setInterval(() => {

    coins += coinsPerSecond;

    updateDisplay();

},1000);



// -------------------------
// Save score
// -------------------------

document
    .getElementById("saveScoreBtn")
    .addEventListener("click", saveScore);



async function saveScore(){

    const name =
        document.getElementById("playerName").value.trim();


    if(!name){
        alert("Enter your name first");
        return;
    }


    const { error } =
        await supabaseClient
            .from("players")
            .upsert({

                id: playerKey,
                name: name,
                coins: Math.floor(coins)

            });


    if(error){

        console.error(error);
        alert("Could not save score");

    }
    else {

        document.getElementById("leaderboardStatus")
            .textContent =
            "Score saved!";

        loadLeaderboard();

    }

}



// -------------------------
// Leaderboard
// -------------------------

async function loadLeaderboard(){

    const { data, error } =
        await supabaseClient
            .from("players")
            .select("name, coins")
            .order("coins", {
                ascending:false
            })
            .limit(10);



    if(error){
        console.error(error);
        return;
    }


    const list =
        document.getElementById("leaderboardList");


    list.innerHTML = "";


    data.forEach(player => {

        const li =
            document.createElement("li");


        li.textContent =
            `${player.name}: ${player.coins}`;


        list.appendChild(li);

    });

}


loadLeaderboard();



// -------------------------
// Restore player
// -------------------------

document
    .getElementById("restoreKeyBtn")
    .addEventListener("click", async ()=>{


        const key =
            document.getElementById("restoreKeyInput")
                .value.trim();


        if(!key) return;


        const { data, error } =
            await supabaseClient
                .from("players")
                .select("*")
                .eq("id", key)
                .single();



        if(error || !data){

            alert("Player not found");
            return;

        }


        playerKey = key;

        localStorage.setItem(
            "playerKey",
            key
        );


        coins = data.coins;


        document
            .getElementById("playerName")
            .value = data.name;


        updateDisplay();


        alert("Player restored");

    });



// -------------------------
// Owner dashboard check
// -------------------------

async function checkOwner(){

    const user =
        (await supabaseClient.auth.getUser())
            .data.user;


    if(!user) return;



    const { data } =
        await supabaseClient
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();



    if(data?.role === "owner"){

        document
            .getElementById("ownerDashboardBtn")
            .style.display="block";

    }

}


checkOwner();