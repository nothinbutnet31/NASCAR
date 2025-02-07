const sheetId = "19LbY1UwCkPXyVMMnvdu_KrYpyi6WhNcfuC6wjzxeBLI";
const apiKey = "AIzaSyDWBrtpo54AUuVClU49k0FdrLl-IFPpMdY";
const totalsRange = "Totals!A1:G27";
const driversRange = "Drivers!A1:AB43";

let standingsData = { weeks: [], teams: {} };
let isDataLoaded = false; // Track if data is fully loaded

// Fetch data from Google Sheets
async function fetchDataFromGoogleSheets() {
  const totalsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${totalsRange}?key=${apiKey}`;
  const driversUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${driversRange}?key=${apiKey}`;

  try {
    // Fetch both team totals and driver data simultaneously
    const [totalsResponse, driversResponse] = await Promise.all([
      fetch(totalsUrl),
      fetch(driversUrl),
    ]);

    // Check if responses are OK
    if (!totalsResponse.ok || !driversResponse.ok) {
      throw new Error("One of the fetch requests failed.");
    }

    const totalsData = await totalsResponse.json();
    const driversDataResponse = await driversResponse.json();

    console.log("Totals Data:", totalsData.values);
    console.log("Drivers Data:", driversDataResponse.values);

    // Process both datasets
    processTotalsData(totalsData.values);
    processDriversData(driversDataResponse.values);

    // Mark data as loaded and initialize the UI
    isDataLoaded = true;
    init();
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error);
  }
}

// Process team totals data
function processTotalsData(data) {
  const headerRow = data[0]; // Team names are in the header row
  const trackRows = data.slice(1); // Skip the header row

  standingsData.weeks = trackRows.map((row, index) => ({
    week: index + 1,
    track: row[0], // Track name is in the first column
    standings: {},
  }));

  headerRow.slice(1).forEach((team, teamIndex) => {
    trackRows.forEach((row, trackIndex) => {
      standingsData.weeks[trackIndex].standings[team] = parseInt(row[teamIndex + 1], 10);
    });
  });

  console.log("Processed Totals Data:", standingsData);
}

// Process driver data
function processDriversData(data) {
  const headerRow = data[0]; // Header row (driver, team, points, …)
  const driverRows = data.slice(1); // Skip header row

  const teams = {};

  driverRows.forEach((row) => {
    const driver = row[0]; // Driver name in first column
    const team = row[1];   // Team name in second column

    if (driver && team) {
      // Initialize team if not already present
      if (!teams[team]) {
        teams[team] = {
          drivers: [],
          totals: new Array(headerRow.length - 2).fill(0), // Totals for each track
        };
      }

      // Add driver data
      const points = row.slice(2).map((points) => parseInt(points, 10));
      const totalPoints = points.reduce((sum, point) => sum + point, 0);
      teams[team].drivers.push({ driver, points, totalPoints });

      // Update team totals per track
      points.forEach((pt, index) => {
        teams[team].totals[index] += pt;
      });
    } else if (driver === "Total") {
      console.log(`Total for ${team}: ${row.slice(2).join(", ")}`);
    }
  });

  standingsData.teams = teams;
  console.log("Processed Drivers Data:", standingsData.teams);
}

// Load Overall Standings
function loadOverallStandings() {
  const overallTable = document.querySelector("#overall-standings tbody");
  overallTable.innerHTML = "";

  const totalPoints = {};

  standingsData.weeks.forEach((week) => {
    for (const [team, points] of Object.entries(week.standings)) {
      totalPoints[team] = (totalPoints[team] || 0) + points;
    }
  });

  // Sort teams by points descending
  const sortedTeams = Object.entries(totalPoints).sort((a, b) => b[1] - a[1]);

  sortedTeams.forEach(([team, points], index) => {
    const row = document.createElement("tr");
    // Add trophy icon for first place
    const trophy = index === 0 ? '<i class="fas fa-trophy"></i> ' : "";
    row.innerHTML = `
      <td>${trophy}${team}</td>
      <td>${points}</td>
    `;
    overallTable.appendChild(row);
  });

  highlightLeader();
}

// Highlight Leader in Overall Standings
function highlightLeader() {
  const overallTable = document.querySelector("#overall-standings tbody");
  const firstRow = overallTable.querySelector("tr");
  if (firstRow) {
    firstRow.classList.add("leader");
  }
}

// Load Weekly Standings
function loadWeeklyStandings() {
  const weekSelect = document.getElementById("week-select");
  const selectedWeekNumber = parseInt(weekSelect.value, 10);
  const weeklyTable = document.querySelector("#weekly-standings tbody");
  weeklyTable.innerHTML = "";

  // Find the week matching the selected week number
  const weekData = standingsData.weeks.find((week) => week.week === selectedWeekNumber);

  if (weekData) {
    const sortedStandings = Object.entries(weekData.standings).sort((a, b) => b[1] - a[1]);

    sortedStandings.forEach(([team, points], index) => {
      const row = document.createElement("tr");
      // Add checkered flag icon for first place if points > 0
      const flag = index === 0 && points > 0 ? '<i class="fas fa-flag-checkered"></i> ' : "";
      row.innerHTML = `
        <td>${flag}${team}</td>
        <td>${points}</td>
      `;
      weeklyTable.appendChild(row);
    });
  }
}

// Generate AI Recap for the Selected Week
function generateWeeklyRecap() {
  const recapContainer = document.getElementById("weekly-recap");
  if (!recapContainer) {
    console.error("Weekly recap container not found.");
    return;
  }

  const weekSelect = document.getElementById("week-select");
  const selectedWeekNumber = parseInt(weekSelect.value, 10);
  const selectedWeek = standingsData.weeks.find((week) => week.week === selectedWeekNumber);

  // If no data is available for the week, or there are no standings, exit early.
  if (!selectedWeek || Object.keys(selectedWeek.standings).length === 0) {
    recapContainer.innerHTML = "<p>No race data available for this week.</p>";
    return;
  }

  // Calculate the total points scored in the week.
  const weekTotal = Object.values(selectedWeek.standings).reduce((sum, points) => sum + points, 0);
  if (weekTotal === 0) {
    recapContainer.innerHTML = "<p>No points were scored in this race.</p>";
    return;
  }

  let recapText = `<h3>Race Recap: ${selectedWeek.track}</h3>`;
  const sortedTeams = Object.entries(selectedWeek.standings).sort((a, b) => b[1] - a[1]);

  // Winner highlight: only if the winning team scored more than 0 points.
  const [winningTeam, winningPoints] = sortedTeams[0];
  if (winningPoints > 0) {
    recapText += `<p>🏆 <strong>${winningTeam}</strong> dominated the race at <strong>${selectedWeek.track}</strong>, scoring ${winningPoints} points!</p>`;
  } else {
    recapContainer.innerHTML = "<p>No team scored any points this week.</p>";
    return;
  }

  // Biggest mover compared to the previous week.
  if (selectedWeek.week > 1) {
    const previousWeek = standingsData.weeks.find((week) => week.week === (selectedWeek.week - 1));
    if (previousWeek && Object.keys(previousWeek.standings).length > 0) {
      let biggestMover = null;
      let biggestChange = 0;

      // Calculate the change in points for each team.
      for (const [team, points] of Object.entries(selectedWeek.standings)) {
        const prevPoints = previousWeek.standings[team] || 0;
        const change = points - prevPoints;
        // Update biggest mover only if the change is nonzero and larger than the current biggest change.
        if (Math.abs(change) > Math.abs(biggestChange)) {
          biggestMover = team;
          biggestChange = change;
        }
      }

      // Only include the biggest mover if the change is nonzero.
      if (biggestMover && biggestChange !== 0) {
        if (biggestChange > 0) {
          recapText += `<p>📈 <strong>${biggestMover}</strong> surged ahead by ${biggestChange} points compared to last week!</p>`;
        } else {
          recapText += `<p>📉 <strong>${biggestMover}</strong> fell behind by ${Math.abs(biggestChange)} points compared to last week!</p>`;
        }
      }
    }
  }

  // Lowest scoring team: only display if it is different from the winner.
  const [lowestTeam, lowestPoints] = sortedTeams[sortedTeams.length - 1];
  if (lowestTeam !== winningTeam) {
    recapText += `<p>📉 <strong>${lowestTeam}</strong> struggled, scoring only ${lowestPoints} points.</p>`;
  }

  recapContainer.innerHTML = recapText;
}


// Load Team Page (Roster, Images, etc.)
function loadTeamPage() {
  if (!isDataLoaded) {
    console.warn("Data not fully loaded yet.");
    return;
  }

  const teamSelect = document.getElementById("team-select");
  const trackSelect = document.getElementById("track-select");
  const teamRoster = document.querySelector("#team-roster tbody");
  const teamImage = document.getElementById("team-image");
  const trackImage = document.getElementById("track-image");

  if (!teamSelect || !trackSelect || !teamRoster || !teamImage || !trackImage) {
    console.error("Missing dropdowns or team roster element.");
    return;
  }

  const selectedTeam = teamSelect.value;
  const selectedTrack = trackSelect.value;

  console.log("Selected Team:", selectedTeam);
  console.log("Selected Track:", selectedTrack);

  if (!standingsData.teams[selectedTeam]) {
    console.warn("No data found for selected team:", selectedTeam);
    teamRoster.innerHTML = "<tr><td colspan='3'>No data found for this team.</td></tr>";
    return;
  }

  const teamData = standingsData.teams[selectedTeam];

  if (!teamData.drivers || teamData.drivers.length === 0) {
    console.warn("No drivers found for team:", selectedTeam);
    teamRoster.innerHTML = "<tr><td colspan='3'>No drivers found for this team.</td></tr>";
    return;
  }

  // Set team image (with fallback)
  const teamImageUrl = `https://raw.githubusercontent.com/nothinbutnet31/NASCAR/main/images/teams/${selectedTeam.replace(/\s+/g, '_')}.png`;
  teamImage.src = teamImageUrl;
  teamImage.alt = `${selectedTeam} Logo`;
  teamImage.onerror = function () {
    this.src = "https://via.placeholder.com/100";
  };

  // Set track image (with fallback)
  const trackImageUrl = `https://raw.githubusercontent.com/nothinbutnet31/NASCAR/main/images/tracks/${selectedTrack.replace(/\s+/g, '_')}.png`;
  trackImage.src = trackImageUrl;
  trackImage.alt = `${selectedTrack} Image`;
  trackImage.onerror = function () {
    this.src = "https://via.placeholder.com/200";
  };

  // Repopulate track dropdown (only include tracks where team data exists)
  trackSelect.innerHTML = "";
  standingsData.weeks.forEach((week, index) => {
    if (teamData.totals[index] !== undefined && teamData.totals[index] > 0) {
      const option = document.createElement("option");
      option.value = week.track;
      option.textContent = week.track;
      trackSelect.appendChild(option);
    }
  });

  if (trackSelect.options.length === 0) {
    teamRoster.innerHTML = "<tr><td colspan='3'>No data available for any track.</td></tr>";
    return;
  }

  // Default to the first available track
  trackSelect.value = trackSelect.options[0].value;

  // Update table header to reflect the selected track
  const trackHeader = document.querySelector("#team-roster th:nth-child(2)");
  if (trackHeader) {
    trackHeader.textContent = `Points (${selectedTrack})`;
  }

  // Determine the index of the selected track in the weeks array
  const trackIndex = standingsData.weeks.findIndex((week) => week.track === selectedTrack);

  // Populate the team roster table with driver data
  teamRoster.innerHTML = teamData.drivers
    .map(
      (driver) => `
      <tr>
        <td>${driver.driver}</td>
        <td>${driver.points[trackIndex]}</td>
        <td>${driver.totalPoints}</td>
      </tr>`
    )
    .join("");
}


  // Add a total row
  const teamTotalPoints = teamData.drivers.reduce((sum, driver) => sum + driver.totalPoints, 0);
  teamRoster.innerHTML += `
    <tr class="total-row">
      <td><strong>Total</strong></td>
      <td><strong>${teamData.totals[trackIndex] || 0}</strong></td>
      <td><strong>${teamTotalPoints || 0}</strong></td>
    </tr>
  `;
}

// Populate Team Dropdown
function populateTeamDropdown() {
  const teamSelect = document.getElementById("team-select");
  teamSelect.innerHTML = "";

  const teams = Object.keys(standingsData.teams);

  if (teams.length > 0) {
    teams.forEach((team) => {
      const option = document.createElement("option");
      option.value = team;
      option.textContent = team;
      teamSelect.appendChild(option);
    });

    // Update team page when a new team is selected
    teamSelect.addEventListener("change", loadTeamPage);
    loadTeamPage();
  }
}

// Populate Week Dropdown
function populateWeekDropdown() {
  const weekSelect = document.getElementById("week-select");
  if (!weekSelect) {
    console.error("Week select dropdown not found.");
    return;
  }

  weekSelect.innerHTML = ""; // Clear any existing options

  standingsData.weeks.forEach((week) => {
    const option = document.createElement("option");
    option.value = week.week; // The week number
    option.textContent = `Week ${week.week} - ${week.track}`;
    weekSelect.appendChild(option);
  });

  if (standingsData.weeks.length > 0) {
    weekSelect.value = standingsData.weeks[0].week;
    loadWeeklyStandings();
  }
}

// Open Tabs (for switching between pages/sections)
function openTab(tabName) {
  const tabcontents = document.querySelectorAll(".tabcontent");
  const tablinks = document.querySelectorAll(".tablink");

  tabcontents.forEach((tab) => (tab.style.display = "none"));
  tablinks.forEach((link) => link.classList.remove("active"));

  document.getElementById(tabName).style.display = "block";
  document.querySelector(`[onclick="openTab('${tabName}')"]`).classList.add("active");

  if (tabName === "teams") {
    populateTeamDropdown();
    loadTeamPage();
  }
}

// Initialize the Page after data is loaded
function init() {
  if (!isDataLoaded) {
    console.warn("Data not fully loaded yet.");
    return;
  }

  // Load overall standings
  loadOverallStandings();

  // Populate and initialize the week dropdown, standings, and recap
  populateWeekDropdown();
  loadWeeklyStandings();
  generateWeeklyRecap();

  // When the week selection changes, update standings and recap
  const weekSelect = document.getElementById("week-select");
  weekSelect.addEventListener("change", () => {
    loadWeeklyStandings();
    generateWeeklyRecap();
  });

  // Populate team dropdown and load the team page
  populateTeamDropdown();
  loadTeamPage();
}

// On window load, start fetching data from Google Sheets
window.onload = () => {
  fetchDataFromGoogleSheets();
};
