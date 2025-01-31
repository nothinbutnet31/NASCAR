const sheetId = "19LbY1UwCkPXyVMMnvdu_KrYpyi6WhNcfuC6wjzxeBLI";
const apiKey = "AIzaSyDWBrtpo54AUuVClU49k0FdrLl-IFPpMdY";
const range = "Sheet1!A1:G27";
let standingsData = { weeks: [] };

async function fetchDataFromGoogleSheets() {
  const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
  
  try {
    let response = await fetch(sheetUrl);
    
    // If CORS error, use a proxy
    if (!response.ok) {
      console.warn("Direct fetch failed, trying proxy...");
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(sheetUrl)}`;
      response = await fetch(proxyUrl);
      
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const json = await response.json();
      processSheetData(JSON.parse(json.contents).values);
    } else {
      const data = await response.json();
      processSheetData(data.values);
    }
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error);
  }
}

// Process Google Sheets data
function processSheetData(data) {
  if (!data) {
    console.error("No data received.");
    return;
  }

  standingsData.weeks = data.map((row, index) => ({
    week: index,
    track: row[0] || "Unknown",
    standings: {
      Emilia: Number(row[1]) || 0,
      Grace: Number(row[2]) || 0,
      Heather: Number(row[3]) || 0,
      Edmund: Number(row[4]) || 0,
      Dan: Number(row[5]) || 0,
      Midge: Number(row[6]) || 0,
    }
  }));

  init();
}

// Load overall standings
function loadOverallStandings() {
  const overallTable = document.querySelector("#overall-standings tbody");
  overallTable.innerHTML = "";

  const totalPoints = {};

  standingsData.weeks.forEach((week) => {
    for (const [team, points] of Object.entries(week.standings)) {
      totalPoints[team] = (totalPoints[team] || 0) + points;
    }
  });

  Object.entries(totalPoints)
    .sort((a, b) => b[1] - a[1])
    .forEach(([team, points]) => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${team}</td><td>${points}</td>`;
      overallTable.appendChild(row);
    });
}

// Load weekly standings
function loadWeeklyStandings() {
  const weekSelect = document.getElementById("week-select");
  const selectedWeek = weekSelect.value;
  const weeklyTable = document.querySelector("#weekly-standings tbody");
  weeklyTable.innerHTML = "";

  const weekData = standingsData.weeks.find((week) => week.week == selectedWeek);

  if (weekData) {
    Object.entries(weekData.standings)
      .sort((a, b) => b[1] - a[1])
      .forEach(([team, points]) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${team}</td><td>${points}</td>`;
        weeklyTable.appendChild(row);
      });
  }
}

// Populate week dropdown
function populateWeekDropdown() {
  const weekSelect = document.getElementById("week-select");
  weekSelect.innerHTML = "";

  standingsData.weeks.forEach((week) => {
    const option = document.createElement("option");
    option.value = week.week;
    option.textContent = `Week ${week.week} - ${week.track}`;
    weekSelect.appendChild(option);
  });
}

// Open tabs
function openTab(tabName) {
  document.querySelectorAll(".tabcontent").forEach((tab) => (tab.style.display = "none"));
  document.querySelectorAll(".tablink").forEach((link) => link.classList.remove("active"));

  document.getElementById(tabName).style.display = "block";
  document.querySelector(`.tablink[data-tab="${tabName}"]`)?.classList.add("active");
}

// Initialize the page
function init() {
  populateWeekDropdown();
  loadOverallStandings();
  loadWeeklyStandings();
}

// Fetch data and initialize
fetchDataFromGoogleSheets();
