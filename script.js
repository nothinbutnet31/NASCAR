// Constants and Initial Data
const sheetId = "19LbY1UwCkPXyVMMnvdu_KrYpyi6WhNcfuC6wjzxeBLI";
const apiKey = "AIzaSyDWBrtpo54AUuVClU49k0FdrLl-IFPpMdY";
const driversRange = "Drivers!A1:AA45";

let isDataLoaded = false;

const scoringSystem = {
  "1st": 40, "2nd": 35, "3rd": 34, "4th": 33, "5th": 32,
  "6th": 31, "7th": 30, "8th": 29, "9th": 28, "10th": 27,
  "11th": 26, "12th": 25, "13th": 24, "14th": 23, "15th": 22,
  "16th": 21, "17th": 20, "18th": 19, "19th": 18, "20th": 17,
  "21st": 16, "22nd": 15, "23rd": 14, "24th": 13, "25th": 12,
  "26th": 11, "27th": 10, "28th": 9, "29th": 8, "30th": 7,
  "31st": 6, "32nd": 5, "33rd": 4, "34th": 3, "35th": 2,
  "36th": 1, "37th": 1, "38th": 1, "39th": 1, "40th": 1,
  "Fastest Lap": 1, "Stage 1 Winner": 10, "Stage 2 Winner": 10, "Pole Winner": 5
};

let standingsData = {
  weeks: [],
  teams: {
    Midge: {
      drivers: ["Denny Hamlin", "William Byron", "Ricky Stenhouse Jr.", "Ryan Preece", "Shane van Gisbergen"]
    },
    Emilia: { 
      drivers: ["Austin Cindric", "Austin Dillon", "Kyle Larson", "AJ Allmendiner", "Alex Bowman"]
    },
    Heather: { 
      drivers: ["Kyle Busch", "Chase Elliott", "Erik Jones", "Tyler Reddick", "Michael McDowell"]
    },
    Dan: {
      drivers: ["Brad Keselowski", "Chris Buescher", "Noah Gragson", "Joey Logano", "Cole Custer"]
    },
    Grace: {
      drivers: ["Ross Chastain", "Chase Briscoe", "Josh Berry", "Bubba Wallace", "Daniel Suarez"]
    },
    Edmund: {
      drivers: ["Ryan Blaney", "Christopher Bell", "Riley Herbst", "Ty Gibbs", "Carson Hocevar"]
    }
  }
};

// Core Data Loading Functions
async function fetchDataFromGoogleSheets() {
  const driversUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${driversRange}?key=${apiKey}`;

  try {
    const response = await fetch(driversUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch data from Google Sheets");
    }

    const data = await response.json();
    if (data.values && data.values.length > 0) {
      processRaceData(data.values);
      isDataLoaded = true;
      initializeApp();
    } else {
      throw new Error("No data received from Google Sheets");
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    document.body.innerHTML = `<div class="error">Error loading data: ${error.message}</div>`;
  }
}

function processRaceData(data) {
  const headerRow = data[0];
  const positions = data.slice(1);
  
  standingsData.weeks = [];
  
  headerRow.slice(1).forEach((track, trackIndex) => {
    if (!track) return;

    let raceResults = {
      track: track.trim(),
      week: trackIndex + 1,
      standings: {}
    };

    Object.entries(standingsData.teams).forEach(([teamName, team]) => {
      let teamPoints = 0;
      let driverPoints = {};

      team.drivers.forEach(driver => {
        let points = 0;
        positions.forEach((row) => {
          if (row[trackIndex + 1] === driver) {
            const category = row[0];
            points += scoringSystem[category] || 0;
          }
        });

        driverPoints[driver] = points;
        teamPoints += points;
      });

      raceResults.standings[teamName] = {
        total: teamPoints,
        drivers: driverPoints
      };
    });

    standingsData.weeks.push(raceResults);
  });
}

// Utility Functions
function calculateTeamPosition(teamName) {
  const totalPoints = {};
  
  standingsData.weeks.forEach((week) => {
    Object.entries(week.standings).forEach(([team, data]) => {
      totalPoints[team] = (totalPoints[team] || 0) + data.total;
    });
  });

  const sortedTeams = Object.entries(totalPoints)
    .sort((a, b) => b[1] - a[1])
    .map(([team]) => team);

  return sortedTeams.indexOf(teamName) + 1;
}

function highlightLeader() {
  const leaderRow = document.querySelector('.leader-row');
  if (leaderRow) {
    leaderRow.style.backgroundColor = '#fff000';
    leaderRow.style.fontWeight = 'bold';
  }
}

function populateWeekDropdown() {
  const weekSelect = document.getElementById("week-select");
  if (!weekSelect) return;

  weekSelect.innerHTML = "";

  // Add default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select a Week";
  weekSelect.appendChild(defaultOption);

  let lastValidWeekIndex = 0;

  // Add each week and track the most recent non-zero week
  standingsData.weeks.forEach((week, index) => {
    if (week.track && week.track.trim() !== "") {
      // Check if the week has non-zero data
      const hasNonZeroData = Object.values(week.standings).some(
        (teamData) => teamData.total > 0
      );

      if (hasNonZeroData) {
        const option = document.createElement("option");
        option.value = index + 1;
        
        option.textContent = `Week ${index + 1}: ${week.track}`; // Fix: Add backticks
       weekSelect.appendChild(option);
        lastValidWeekIndex = index + 1; // Update the most recent valid week
      }
    }
  });

  // Set the default selected option to the most recent non-zero week
  weekSelect.value = lastValidWeekIndex;
  loadWeeklyStandings(); // Load the standings for the most recent non-zero week
}

function populateTeamDropdown() {
  const teamSelect = document.getElementById("team-select");
  if (!teamSelect) return;

  teamSelect.innerHTML = "";

  // Add default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select a Team";
  teamSelect.appendChild(defaultOption);

  // Add each team
  const teams = Object.keys(standingsData.teams);
  teams.forEach((team, index) => {
    const option = document.createElement("option");
    option.value = team;
    option.textContent = team;
    teamSelect.appendChild(option);

    // Set the first team as the default selected option
    if (index === 0) {
      teamSelect.value = team;
    }
  });

  loadTeamPage(); // Load the page for the first team
}
// Main Feature Functions
function loadOverallStandings() {
  const overallTable = document.querySelector("#overall-standings tbody");
  if (!overallTable) return;
  
  // Set table width
  const overallTableContainer = document.getElementById("overall-standings");
  if (overallTableContainer) {
    overallTableContainer.style.width = "90%";
    overallTableContainer.style.margin = "0 auto";
    const table = overallTableContainer.querySelector("table");
    if (table) {
      table.style.width = "100%";
    }
  }

  overallTable.innerHTML = "";
  const totalPoints = {};

  standingsData.weeks.forEach((week) => {
    Object.entries(week.standings).forEach(([team, data]) => {
      totalPoints[team] = (totalPoints[team] || 0) + data.total;
    });
  });

  const sortedTeams = Object.entries(totalPoints)
    .sort((a, b) => b[1] - a[1]);

  sortedTeams.forEach(([team, points], index) => {
    const row = document.createElement("tr");
    row.className = index === 0 ? 'leader-row' : '';
    const trophy = index === 0 ? '<i class="fas fa-trophy"></i> ' : '';
    row.innerHTML =`
      <td>${trophy}${team}</td>
      <td>${points}</td>
    `;
    overallTable.appendChild(row);
  });

  highlightLeader();
}

function loadWeeklyStandings() {
  const weekSelect = document.getElementById("week-select");
  const weeklyTable = document.querySelector("#weekly-standings tbody");
  const trackImage = document.getElementById("track-image");
  
  if (!weeklyTable) return;
  weeklyTable.innerHTML = "";

  // Set table width and size
  const weeklyTableContainer = document.getElementById("weekly-standings");
  if (weeklyTableContainer) {
    weeklyTableContainer.style.width = "90%";
    weeklyTableContainer.style.margin = "0 auto";
    const table = weeklyTableContainer.querySelector("table");
    if (table) {
      table.style.width = "100%";
      table.style.fontSize = "24px";
      table.style.borderCollapse = "collapse";
    }
    const cells = table.querySelectorAll("td, th");
    cells.forEach(cell => {
      cell.style.padding = "20px 30px";
    });
  }

  if (!weekSelect?.value) {
    const recapContainer = document.getElementById("weekly-recap");
    if (recapContainer) recapContainer.innerHTML = "";
    return;
  }

  const selectedWeek = parseInt(weekSelect.value, 10);
  const weekData = standingsData.weeks[selectedWeek - 1];

  if (weekData) {
    if (trackImage) {
      const trackName = weekData.track.replace(/[^a-zA-Z0-9]/g, '_');
      const trackImageUrl = `https://raw.githubusercontent.com/nothinbutnet31/NASCAR/main/images/tracks/${trackName}.png`;
      trackImage.src = trackImageUrl;
      trackImage.alt = `${weekData.track} Track`;

      trackImage.onerror = function() {
        this.src = "https://via.placeholder.com/200";
      };
    }

    const sortedTeams = Object.entries(weekData.standings)
      .sort((a, b) => b[1].total - a[1].total);

    sortedTeams.forEach(([team, data], index) => {
      const row = document.createElement("tr");
      row.className = index === 0 ? 'leader-row' : '';
      const flag = index === 0 ? '<i class="fas fa-flag-checkered"></i> ' : '';
      row.innerHTML = `
        <td>${flag}${team}</td>
        <td>${data.total}</td>
      `;
      weeklyTable.appendChild(row);
    });

    generateWeeklyRecap();
  }
}

function generateWeeklyRecap() {
  const recapContainer = document.getElementById("weekly-recap");
  if (!recapContainer) return;

  const weekSelect = document.getElementById("week-select");
  if (!weekSelect) return;

  const selectedWeek = parseInt(weekSelect.value, 10);
  const weekData = standingsData.weeks[selectedWeek - 1];

  if (!weekData) {
    recapContainer.innerHTML = "<p>No data available for this week.</p>";
    return;
  }

  let recapText = `<h3>Race Recap: ${weekData.track}</h3>`;

  const weeklyPoints = Object.values(weekData.standings).map(data => data.total);
  const avgPoints = weeklyPoints.reduce((a, b) => a + b, 0) / weeklyPoints.length;

  recapText +=` 
    <div class="recap-section">
      <h4>📊 Weekly Overview</h4>
      <ul>
        <li>Average Team Score: ${avgPoints.toFixed(1)} points</li>
        <li>Teams Above Average: ${weeklyPoints.filter(p => p > avgPoints).length}</li>
        <li>Point Spread: ${Math.max(...weeklyPoints) - Math.min(...weeklyPoints)} points</li>
      </ul>
    </div>
  `;

  const sortedTeams = Object.entries(weekData.standings)
    .sort((a, b) => b[1].total - a[1].total);
  
  const [winningTeam, winningData] = sortedTeams[0];
  recapText += `
    <div class="recap-section">
      <h4>🏆 Top Performers</h4>
      <p><strong>${winningTeam}</strong> won the week with ${winningData.total} points!</p>
    `;

  const allDriversScores = [];
  Object.entries(weekData.standings).forEach(([team, data]) => {
    Object.entries(data.drivers).forEach(([driver, points]) => {
      allDriversScores.push({ team, driver, points });
    });
  });

  const topDrivers = allDriversScores
    .sort((a, b) => b.points - a.points);

  recapText += `<p>Top Scoring Drivers:</p><ul>`;
  topDrivers.forEach(({ driver, team, points }) => {
    recapText += `<li>${driver} (${team}) - ${points} points</li>`;
  });
  recapText += `</ul></div>`;

  recapContainer.innerHTML = recapText;
}

function loadTeamPage() {
  if (!isDataLoaded) return;

  const teamSelect = document.getElementById("team-select");
  const trackSelect = document.getElementById("track-select");
  if (!teamSelect) return;

  const selectedTeam = teamSelect.value;
  const teamRoster = document.querySelector("#team-roster tbody");
  const teamImage = document.getElementById("team-image");
  const teamStatsContainer = document.getElementById("team-stats");

  if (!standingsData.teams[selectedTeam] || !teamRoster) return;

  // Clear and populate track select dropdown
  if (trackSelect) {
    trackSelect.innerHTML = "";
    // Add default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "All Races";
    trackSelect.appendChild(defaultOption);

    let lastValidTrackIndex = 0;

    // Add each track and track the most recent non-zero track
    standingsData.weeks.forEach((week, index) => {
      if (week.track && week.track.trim() !== "") {
        // Check if the track has non-zero data for the selected team
        const teamData = week.standings[selectedTeam];
        const hasNonZeroData = teamData && teamData.total > 0;

        if (hasNonZeroData) {
          const option = document.createElement("option");
          option.value = index;
          option.textContent = week.track;
          trackSelect.appendChild(option);
          lastValidTrackIndex = index; // Update the most recent valid track
        }
      }
    });

    // Set the default selected option to the most recent non-zero track
    trackSelect.value = lastValidTrackIndex;
  }

  // Calculate driver points based on track selection
  const selectedTrackIndex = trackSelect ? trackSelect.value : "";
  const driverTotals = {};
  const driverSeasonTotals = {};  // Add this for season totals

  standingsData.teams[selectedTeam].drivers.forEach((driver) => {
    driverTotals[driver] = 0;
    driverSeasonTotals[driver] = 0;  // Initialize season total

    // Calculate season total points
    standingsData.weeks.forEach((week) => {
      if (week.standings[selectedTeam]?.drivers[driver]) {
        driverSeasonTotals[driver] += week.standings[selectedTeam].drivers[driver];
      }
    });

    // Calculate selected race points
    if (selectedTrackIndex !== "") {
      const week = standingsData.weeks[selectedTrackIndex];
      if (week?.standings[selectedTeam]?.drivers[driver]) {
        driverTotals[driver] = week.standings[selectedTeam].drivers[driver];
      }
    }
  });

  // Update the team roster display
  teamRoster.innerHTML = "";
  Object.entries(driverTotals).forEach(([driver, points]) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${driver}</td>
      <td class="points-cell">${points}</td>
      <td class="points-cell">${driverSeasonTotals[driver]}</td>
    `;
    teamRoster.appendChild(row);
  });

  // Update team image
  if (teamImage) {
    const teamImageName = selectedTeam.replace(/[^a-zA-Z0-9]/g, "_");
    const teamImageUrl = `https://raw.githubusercontent.com/nothinbutnet31/NASCAR/main/images/teams/${teamImageName}.png`;
    teamImage.src = teamImageUrl;
    teamImage.alt = `${selectedTeam} Logo`;

    teamImage.onerror = function () {
      this.src = "https://via.placeholder.com/100";
    };
  }

  // Update team statistics
  if (teamStatsContainer) {
    const position = calculateTeamPosition(selectedTeam);
    const raceCount = selectedTrackIndex === "" ? standingsData.weeks.length : 1;
    const averagePoints = (driverSeasonTotals[selectedTeam] / raceCount).toFixed(1);

    teamStatsContainer.innerHTML = `
      <h3>Team Statistics</h3>
      <p>Current Position: ${position}</p>
      <p>Total Points: ${driverSeasonTotals[selectedTeam]}</p>
      <p>Average Points per Race: ${averagePoints}</p>
    `;
  }

  // Fix layout for team details section
  const teamDetails = document.getElementById("team-details");
  if (teamDetails) {
    teamDetails.style.display = "flex";
    teamDetails.style.flexDirection = "row";
    teamDetails.style.justifyContent = "center";
    teamDetails.style.alignItems = "flex-start";
    teamDetails.style.gap = "100px";  // Increased gap
    teamDetails.style.margin = "20px 0";
  }

  // Style the selection containers
  const teamSelection = document.querySelector(".team-selection");
  const trackSelection = document.querySelector(".track-selection");
  if (teamSelection && trackSelection) {
    [teamSelection, trackSelection].forEach(container => {
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.alignItems = "center";
      container.style.gap = "20px";
      container.style.minWidth = "300px";  // Set minimum width
      container.style.visibility = "visible";  // Ensure visibility
      container.style.position = "relative";  // Reset position
    });
  }
}

function openTab(tabName) {
  const tabcontents = document.querySelectorAll(".tabcontent");
  const tablinks = document.querySelectorAll(".tablink");

  tabcontents.forEach(tab => tab.style.display = "none");
  tablinks.forEach(link => link.classList.remove("active"));
 // Show the selected tab content
  const selectedTab = document.getElementById(tabName);
  if (selectedTab) {
    selectedTab.style.display = "block";
  }

  // Add the "active" class to the selected tab link
  const selectedTabLink = document.querySelector(`[onclick="openTab('${tabName}')"]`);
  if (selectedTabLink) {
    selectedTabLink.classList.add("active");
  }

  // Load data for the selected tab
  if (tabName === "weekly-standings") {
    loadWeeklyStandings();
  } else if (tabName === "teams") {
    loadTeamPage();
  }
}

function initializeApp() {
  if (!isDataLoaded) return;

  // First populate data
  populateWeekDropdown();
  populateTeamDropdown();
  
  // Load all data first
  loadOverallStandings();
  loadWeeklyStandings();
  
  // Hide all tabs initially
  const tabcontents = document.querySelectorAll(".tabcontent");
  tabcontents.forEach(tab => tab.style.display = "none");
  
  // Show weekly standings tab and mark it as active
  const weeklyTab = document.getElementById("weekly-standings");
  if (weeklyTab) {
    weeklyTab.style.display = "block";
    
    // Make sure the table is properly sized
    const table = weeklyTab.querySelector("table");
    if (table) {
      table.style.width = "100%";
      table.style.fontSize = "24px";
    }
  }
  
  // Mark the weekly standings tab button as active
  const tablinks = document.querySelectorAll(".tablink");
  tablinks.forEach(link => link.classList.remove("active"));
  const weeklyTabLink = document.querySelector(`[onclick="openTab('weekly-standings')"]`);
  if (weeklyTabLink) {
    weeklyTabLink.classList.add("active");
  }

  // Force load weekly standings
  loadWeeklyStandings();
}

// Make sure to call initializeApp after data is loaded
window.onload = fetchDataFromGoogleSheets;
