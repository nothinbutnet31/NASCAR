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
  const rows = data.slice(1); // Skip the header row
  standingsData.weeks = rows.map((row, index) => ({
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


// Dark Mode Toggle
const darkModeToggle = document.getElementById("dark-mode-toggle");
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
});

// Load Dark Mode Preference
if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark-mode");
}

// Search and Filter Teams
function filterTeams() {
  const searchTerm = document.getElementById("search").value.toLowerCase();
  const rows = document.querySelectorAll("#overall-standings tbody tr");

  rows.forEach(row => {
    const teamName = row.cells[0].textContent.toLowerCase();
    if (teamName.includes(searchTerm)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

// Create Overall Chart
function createOverallChart() {
  const overallTable = document.querySelector("#overall-standings tbody");
  const teams = [];
  const points = [];

  overallTable.querySelectorAll("tr").forEach(row => {
    teams.push(row.cells[0].textContent);
    points.push(parseInt(row.cells[1].textContent));
  });

  const ctx = document.getElementById("overallChart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: teams,
      datasets: [{
        label: "Total Points",
        data: points,
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Highlight Leader
function highlightLeader() {
  const overallTable = document.querySelector("#overall-standings tbody");
  const firstRow = overallTable.querySelector("tr");
  if (firstRow) {
    firstRow.classList.add("leader");
  }
}

// Update loadOverallStandings to include chart and leader highlight
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
    row.innerHTML = `<td><img src="${team.toLowerCase()}-logo.png" alt="${team}" class="team-logo"> ${team}</td><td>${points}</td>`;
    overallTable.appendChild(row);
  });

  createOverallChart();
  highlightLeader();
}
function loadWeeklyStandings() {
  const weekSelect = document.getElementById("week-select");
  const selectedWeek = weekSelect.value;
  const weeklyTable = document.querySelector("#weekly-standings tbody");
  weeklyTable.innerHTML = "";

  const weekData = standingsData.weeks.find((week) => week.week == selectedWeek);

  if (weekData) {
    const sortedStandings = Object.entries(weekData.standings).sort((a, b) => b[1] - a[1]);

    sortedStandings.forEach(([team, points], index) => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${team}</td><td>${points}</td>`;
      if (index === 0) row.style.backgroundColor = "#ff4500"; // Highlight leader
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
