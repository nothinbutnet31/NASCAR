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
// [Previous code remains the same until the generateWeeklyRecap function]

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
  const trackIndex = selectedWeekNumber - 1;

  if (!selectedWeek || Object.keys(selectedWeek.standings).length === 0) {
    recapContainer.innerHTML = "<p>No race data available for this week.</p>";
    return;
  }

  let recapText = `<h3>Race Recap: ${selectedWeek.track}</h3>`;
  const sortedTeams = Object.entries(selectedWeek.standings).sort((a, b) => b[1] - a[1]);

  if (sortedTeams.length === 0) {
    recapContainer.innerHTML = "<p>No race results to display.</p>";
    return;
  }

  // Weekly Overview Section
  recapText += `<div class="recap-section">
    <h4>📊 Weekly Overview</h4>
    <ul>
      <li>Average Team Score: ${calculateAverageTeamScore(selectedWeek.standings)} points</li>
      <li>Teams Above Average: ${countTeamsAboveAverage(selectedWeek.standings)}</li>
      <li>Point Spread (Highest to Lowest): ${calculatePointSpread(selectedWeek.standings)} points</li>
    </ul>
  </div>`;

  // Top Performers Section
  const [winningTeam, winningPoints] = sortedTeams[0];
  recapText += `<div class="recap-section">
    <h4>🏆 Top Performers</h4>
    <p><strong>${winningTeam}</strong> won the week at <strong>${selectedWeek.track}</strong> with ${winningPoints} points!</p>`;
  
  // Get winning team's drivers who scored 30+ points
  const topDrivers = standingsData.teams[winningTeam].drivers.filter(
    driver => driver.points[trackIndex] >= 30
  );
  
  if (topDrivers.length > 0) {
    recapText += `<p>💫 Star Drivers:</p><ul>`;
    topDrivers.forEach(driver => {
      recapText += `<li>${driver.driver} (${driver.points[trackIndex]} points)</li>`;
    });
    recapText += '</ul>';
  }

  // Add "Value Picks" section
   const breakoutPerformances = findBreakoutPerformances(trackIndex);
  if (breakoutPerformances.length > 0) {
    recapText += `<p>⭐ Breakout Performances:</p><ul>`;
    breakoutPerformances.forEach(({ driver, points, team, improvement, average }) => {
      recapText += `<li>${driver} (${team}) - ${points} points (+${improvement.toFixed(1)} above ${average} avg)</li>`;
    });
    recapText += '</ul>';
  }
  recapText += '</div>';

  // Standings Movement Section
  if (selectedWeek.week > 1) {
    const previousWeek = standingsData.weeks[selectedWeekNumber - 2];
    const currentTotals = {};
    const previousTotals = {};

    // Calculate current and previous totals
    standingsData.weeks.slice(0, selectedWeekNumber).forEach(week => {
      Object.entries(week.standings).forEach(([team, points]) => {
        currentTotals[team] = (currentTotals[team] || 0) + points;
      });
    });

    standingsData.weeks.slice(0, selectedWeekNumber - 1).forEach(week => {
      Object.entries(week.standings).forEach(([team, points]) => {
        previousTotals[team] = (previousTotals[team] || 0) + points;
      });
    });

    // Calculate gaps to leader
    const currentLeader = Object.entries(currentTotals).sort((a, b) => b[1] - a[1])[0];
    recapText += `<div class="recap-section">
      <h4>🏁 Championship Battle</h4>
      <p>Points Behind Leader (${currentLeader[0]}):</p>
      <ul>`;
    
    Object.entries(currentTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(1, 4) // Top 3 chasers
      .forEach(([team, points]) => {
        const gap = currentLeader[1] - points;
        recapText += `<li>${team}: ${gap} points back</li>`;
      });
    recapText += '</ul></div>';

    // Position Changes
    const previousRanking = Object.entries(previousTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([team]) => team);
    const currentRanking = Object.entries(currentTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([team]) => team);

    const changes = [];
    currentRanking.forEach((team, currentPos) => {
      const previousPos = previousRanking.indexOf(team);
      const positionChange = previousPos - currentPos;
      if (positionChange !== 0) {
        changes.push({
          team,
          change: positionChange,
          currentPos: currentPos + 1
        });
      }
    });

    if (changes.length > 0) {
      recapText += '<div class="recap-section"><h4>📈 Standings Changes</h4><ul>';
      changes.forEach(({ team, change, currentPos }) => {
        const direction = change > 0 ? 'up' : 'down';
        const arrow = change > 0 ? '⬆️' : '⬇️';
        recapText += `<li>${arrow} ${team} moved ${direction} ${Math.abs(change)} position${Math.abs(change) > 1 ? 's' : ''} to ${currentPos}${getOrdinalSuffix(currentPos)} place</li>`;
      });
      recapText += '</ul></div>';
    }
  }

  // Struggles and Disappointments Section
  const [lowestTeam, lowestPoints] = sortedTeams[sortedTeams.length - 1];
  recapText += `<div class="recap-section">
    <h4>😔 Struggles and Disappointments</h4>
    <p><strong>${lowestTeam}</strong> had a tough week with ${lowestPoints} points.</p>`;
  
  // Get lowest team's drivers who scored 5 or fewer points
  const struggleDrivers = standingsData.teams[lowestTeam].drivers.filter(
    driver => driver.points[trackIndex] <= 5
  );
  
  if (struggleDrivers.length > 0) {
    recapText += `<p>Underperforming Drivers:</p><ul>`;
    struggleDrivers.forEach(driver => {
      recapText += `<li>${driver.driver} (${driver.points[trackIndex]} points)</li>`;
    });
    recapText += '</ul>';
  }

  // Add biggest disappointments
  const disappointments = findDisappointments(trackIndex);
  if (disappointments.length > 0) {
    recapText += `<p>📉 Biggest Disappointments:</p><ul>`;
    disappointments.forEach(({ driver, points, team, decline, average }) => {
      recapText += `<li>${driver} (${team}) - ${points} points (${decline.toFixed(1)} below ${average} avg)</li>`;
    });
    recapText += '</ul>';
  }
  recapText += '</div>';

  // Next Week Preview
  if (selectedWeekNumber < standingsData.weeks.length) {
    const nextWeek = standingsData.weeks[selectedWeekNumber];
    recapText += `<div class="recap-section">
      <h4>🔮 Next Week Preview</h4>
      <p>Next Race: ${nextWeek.track}</p>
    </div>`;
  }

  recapContainer.innerHTML = recapText;
}

// [Rest of the code remains the same]
// Helper Functions

function calculateAverageTeamScore(standings) {
  const scores = Object.values(standings);
  return (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1);
}

function countTeamsAboveAverage(standings) {
  const average = calculateAverageTeamScore(standings);
  return Object.values(standings).filter(score => score > average).length;
}

function calculatePointSpread(standings) {
  const scores = Object.values(standings);
  return Math.max(...scores) - Math.min(...scores);
}

// Previous functions remain the same until findValuePicks...

// Rename function to match new terminology
function findBreakoutPerformances(trackIndex) {
  const breakoutPerformances = [];
  Object.entries(standingsData.teams).forEach(([team, teamData]) => {
    teamData.drivers.forEach(driver => {
      const currentPoints = driver.points[trackIndex];
      // Only use points from previous weeks
      const previousPoints = driver.points.slice(0, trackIndex);
      
      // Only proceed if we have previous weeks to compare against
      if (previousPoints.length > 0) {
        const average = previousPoints.reduce((sum, p) => sum + p, 0) / previousPoints.length;
        
        // Adjusted threshold: Must be at least 15 points above average and score at least 25 points
        if (currentPoints > average + 15 && currentPoints >= 25) {
          breakoutPerformances.push({
            driver: driver.driver,
            team,
            points: currentPoints,
            improvement: currentPoints - average,
            average: average.toFixed(1)
          });
        }
      }
    });
  });
  
  return breakoutPerformances.sort((a, b) => b.improvement - a.improvement).slice(0, 3);
}


function findDisappointments(trackIndex) {
  const disappointments = [];
  Object.entries(standingsData.teams).forEach(([team, teamData]) => {
    teamData.drivers.forEach(driver => {
      const currentPoints = driver.points[trackIndex];
      // Only use points from previous weeks
      const previousPoints = driver.points.slice(0, trackIndex);
      
      // Only proceed if we have previous weeks to compare against
      if (previousPoints.length > 0) {
        const average = previousPoints.reduce((sum, p) => sum + p, 0) / previousPoints.length;
        
        // Adjusted threshold: Must be at least 20 points below average and have an average of at least 15
        if (average - currentPoints > 20 && average >= 15) {
          disappointments.push({
            driver: driver.driver,
            team,
            points: currentPoints,
            decline: average - currentPoints,
            average: average.toFixed(1)
          });
        }
      }
    });
  });
  
  return disappointments.sort((a, b) => b.decline - a.decline).slice(0, 3);
}

function getOrdinalSuffix(num) {
  const j = num % 10;
  const k = num % 100;
  if (j == 1 && k != 11) return "st";
  if (j == 2 && k != 12) return "nd";
  if (j == 3 && k != 13) return "rd";
  return "th";
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
        <td>${driver.points[trackIndex] || 0}</td>
        <td>${driver.totalPoints || 0}</td>
      </tr>
    `
    )
    .join("");

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

// Find the most recent week with points
function findLatestWeekWithData() {
  for (let i = standingsData.weeks.length - 1; i >= 0; i--) {
    const week = standingsData.weeks[i];
    // Check if any team has points greater than 0
    const hasPoints = Object.values(week.standings).some(points => points > 0);
    if (hasPoints) {
      return week.week;
    }
  }
  return 1; // Default to week 1 if no weeks with points are found
}

// Initialize the Page after data is loaded
function init() {
  if (!isDataLoaded) {
    console.warn("Data not fully loaded yet.");
    return;
  }

  // Load overall standings
  loadOverallStandings();

  // Populate the week dropdown
  populateWeekDropdown();

  // Find the latest week with data
  const latestWeek = findLatestWeekWithData();
  
  // Set the week select dropdown to the latest week with data
  const weekSelect = document.getElementById("week-select");
  if (weekSelect) {
    weekSelect.value = latestWeek;
  }

  // Load weekly standings and recap for the latest week
  loadWeeklyStandings();
  generateWeeklyRecap();

  // When the week selection changes, update standings and recap
  weekSelect.addEventListener("change", () => {
    loadWeeklyStandings();
    generateWeeklyRecap();
  });

  // Populate team dropdown
  populateTeamDropdown();
  loadTeamPage();

  // Set weekly standings as default tab
  openTab('weekly');
}

// Modify the onload event to include setting the initial tab
window.onload = () => {
  fetchDataFromGoogleSheets();
  // Set weekly tab as active by default
  document.querySelector('[onclick="openTab(\'weekly\')"]').classList.add('active');
  document.getElementById('weekly').style.display = 'block';
  };
