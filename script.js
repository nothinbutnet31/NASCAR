const sheetId = "https://docs.google.com/spreadsheets/d/19LbY1UwCkPXyVMMnvdu_KrYpyi6WhNcfuC6wjzxeBLI/edit";
const apiKey = "AIzaSyDWBrtpo54AUuVClU49k0FdrLl-IFPpMdY";
const range = "Sheet1!A1:G27"; // Adjust the range to match your data

let standingsData = { weeks: [] };

async function fetchDataFromGoogleSheets() {
  const proxyUrl = "https://cors-anywhere.herokuapp.com/"; // Public CORS proxy
  const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
  const url = proxyUrl + sheetUrl; // Use the proxy URL

  try {
    const response = await fetch(url);
    const data = await response.json();
    processSheetData(data.values);
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error);
  }
}

// Process Google Sheets data
function processSheetData(data) {
  standingsData.weeks = data.map((row, index) => ({
    week: index + 1,
    track: row[0],
    standings: {
      Emilia: parseInt(row[1]),
      Grace: parseInt(row[2]),
      Heather: parseInt(row[3]),
      Edmund: parseInt(row[4]),
      Dan: parseInt(row[5]),
      Midge: parseInt(row[6])
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
      if (!totalPoints[team]) totalPoints[team] = 0;
      totalPoints[team] += points;
    }
  });

  const sortedTeams = Object.entries(totalPoints).sort((a, b) => b[1] - a[1]);

  sortedTeams.forEach(([team, points]) => {
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
    const sortedStandings = Object.entries(weekData.standings).sort((a, b) => b[1] - a[1]);

    sortedStandings.forEach(([team, points]) => {
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
  const tabcontents = document.querySelectorAll(".tabcontent");
  const tablinks = document.querySelectorAll(".tablink");

  tabcontents.forEach((tab) => (tab.style.display = "none"));
  tablinks.forEach((link) => link.classList.remove("active"));

  document.getElementById(tabName).style.display = "block";
  document.querySelector(`[onclick="openTab('${tabName}')"]`).classList.add("active");
}

// Initialize the page
function init() {
  populateWeekDropdown();
  loadOverallStandings();
  loadWeeklyStandings();
}

// Fetch data and initialize
fetchDataFromGoogleSheets();
