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

// Fetch data from Google Sheets
async function fetchDataFromGoogleSheets() {
  const driversUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${driversRange}?key=${apiKey}`;

  try {
    const response = await fetch(driversUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch data from Google Sheets");
    }

    const data = await response.json();
    if (!data.values || data.values.length === 0) {
      throw new Error("No data received from Google Sheets");
    }

    console.log("Raw data from sheets:", data.values);
    processRaceData(data.values);
    isDataLoaded = true;
    init();
  } catch (error) {
    console.error("Error fetching data:", error);
    document.body.innerHTML = `<div class="error">Error loading data: ${error.message}</div>`;
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

    // Process each team's drivers
    Object.entries(standingsData.teams).forEach(([teamName, team]) => {
      let teamPoints = 0;
      let driverResults = {};

      team.drivers.forEach(driver => {
        let driverPoints = 0;
        
        // Check each row for the driver's position and bonus points
        positions.forEach(row => {
          const category = row[0];  // Position or bonus category
          const raceDriver = row[trackIndex + 1];
          
          if (raceDriver === driver && scoringSystem[category]) {
            driverPoints += scoringSystem[category];
          }
        });

        driverResults[driver] = driverPoints;
        teamPoints += driverPoints;
      });

      raceResults.standings[teamName] = {
        total: teamPoints,
        drivers: driverResults
      };
    });

    standingsData.weeks.push(raceResults);
  });

  console.log("Processed Race Data:", standingsData);
}

// Load Overall Standings
function loadOverallStandings() {
  const overallTable = document.querySelector("#overall-standings tbody");
  overallTable.innerHTML = "";

  const totalPoints = {};

  standingsData.weeks.forEach((week) => {
    Object.entries(week.standings).forEach(([team, data]) => {
      totalPoints[team] = (totalPoints[team] || 0) + data.total;
    });
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
    const sortedStandings = Object.entries(weekData.standings)
      .sort((a, b) => b[1].total - a[1].total);

    sortedStandings.forEach(([team, data], index) => {
      const row = document.createElement("tr");
      // Add checkered flag icon for first place if points > 0
      const flag = index === 0 && data.total > 0 ? '<i class="fas fa-flag-checkered"></i> ' : "";
      row.innerHTML = `
        <td>${flag}${team}</td>
        <td>${data.total}</td>
      `;
      weeklyTable.appendChild(row);
    });

    generateWeeklyRecap();
  }
}

// Generate Weekly Recap
function generateWeeklyRecap() {
  const recapContainer = document.getElementById("weekly-recap");
  if (!recapContainer) return;

  const weekSelect = document.getElementById("week-select");
  const selectedWeekNumber = parseInt(weekSelect.value, 10);
  const weekData = standingsData.weeks.find((week) => week.week === selectedWeekNumber);

  if (!weekData) {
    recapContainer.innerHTML = "<p>No data available for this week.</p>";
    return;
  }

  let recapText = `<h3>Race Recap: ${weekData.track}</h3>`;

  // Weekly Overview Section
  recapText += `<div class="recap-section">
    <h4>📊 Weekly Overview</h4>
    <ul>
      <li>Average Team Score: ${calculateAverageTeamScore(weekData.standings)} points</li>
      <li>Teams Above Average: ${countTeamsAboveAverage(weekData.standings)}</li>
      <li>Point Spread: ${calculatePointSpread(weekData.standings)} points</li>
    </ul>
  </div>`;

  // Top Performers Section
  const sortedTeams = Object.entries(weekData.standings)
    .sort((a, b) => b[1].total - a[1].total);
  
  const [winningTeam, winningData] = sortedTeams[0];
  recapText += `<div class="recap-section">
    <h4>🏆 Top Performers</h4>
    <p><strong>${winningTeam}</strong> won the week with ${winningData.total} points!</p>`;

  // Get top scoring drivers
  const allDriversScores = [];
  Object.entries(weekData.standings).forEach(([team, data]) => {
    Object.entries(data.drivers).forEach(([driver, points]) => {
      if (points > 0) {
        allDriversScores.push({ team, driver, points });
      }
    });
  });

  const topDrivers = allDriversScores
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  if (topDrivers.length > 0) {
    recapText += `<p>Top Scoring Drivers:</p><ul>`;
    topDrivers.forEach(({ driver, team, points }) => {
      recapText += `<li>${driver} (${team}) - ${points} points</li>`;
    });
    recapText += `</ul>`;
  }
  recapText += `</div>`;

  // Championship Battle Section
  if (selectedWeekNumber > 1) {
    const currentTotals = {};
    standingsData.weeks.slice(0, selectedWeekNumber).forEach(week => {
      Object.entries(week.standings).forEach(([team, data]) => {
        currentTotals[team] = (currentTotals[team] || 0) + data.total;
      });
    });

    const sortedTotals = Object.entries(currentTotals)
      .sort((a, b) => b[1] - a[1]);
    
    const leader = sortedTotals[0];
    recapText += `<div class="recap-section">
      <h4>🏁 Championship Battle</h4>
      <p>Current Leader: <strong>${leader[0]}</strong> (${leader[1]} points)</p>
      <p>Points Behind Leader:</p><ul>`;
    
    sortedTotals.slice(1, 4).forEach(([team, points]) => {
      const gap = leader[1] - points;
      recapText += `<li>${team}: ${gap} points back</li>`;
    });
    recapText += `</ul></div>`;
  }

  recapContainer.innerHTML = recapText;
}

// Utility Functions
function calculateAverageTeamScore(standings) {
  const scores = Object.values(standings).map(data => data.total);
  return (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1);
}

function countTeamsAboveAverage(standings) {
  const average = parseFloat(calculateAverageTeamScore(standings));
  return Object.values(standings).filter(data => data.total > average).length;
}

function calculatePointSpread(standings) {
  const scores = Object.values(standings).map(data => data.total);
  return Math.max(...scores) - Math.min(...scores);
}

// Load Team Page (Roster, Images, etc.)
function loadTeamPage() {
  if (!isDataLoaded || !standingsData.weeks || standingsData.weeks.length === 0) {
    console.warn("Data not fully loaded yet.");
    return;
  }

  const teamSelect = document.getElementById("team-select");
  if (!teamSelect || !teamSelect.value) {
    console.warn("No team selected.");
    return;
  }

  const selectedTeam = teamSelect.value;
  const teamRoster = document.querySelector("#team-roster tbody");
  const teamImage = document.getElementById("team-image");

  if (!standingsData.teams[selectedTeam] || !teamRoster) {
    console.warn("Team data or roster element not found.");
    return;
  }

  // Update team image
  if (teamImage) {
    const teamImageUrl = `https://raw.githubusercontent.com/nothinbutnet31/NASCAR/main/images/teams/${selectedTeam.replace(/\s+/g, '_')}.png`;
    teamImage.src = teamImageUrl;
    teamImage.alt = `${selectedTeam} Logo`;
    teamImage.onerror = function() {
      this.src = "https://via.placeholder.com/100";
    };
  }

  // Update roster
  teamRoster.innerHTML = "";
  const drivers = standingsData.teams[selectedTeam].drivers;
  
  drivers.forEach(driver => {
    const row = document.createElement("tr");
    const totalPoints = standingsData.weeks.reduce((sum, week) => {
      return sum + (week.standings[selectedTeam]?.drivers[driver] || 0);
    }, 0);

    row.innerHTML = `
      <td>${driver}</td>
      <td>${totalPoints}</td>
    `;
    teamRoster.appendChild(row);
  });

  // Add team total row
  const teamTotal = standingsData.weeks.reduce((sum, week) => {
    return sum + (week.standings[selectedTeam]?.total || 0);
  }, 0);

  const totalRow = document.createElement("tr");
  totalRow.classList.add("total-row");
  totalRow.innerHTML = `
    <td><strong>Team Total</strong></td>
    <td><strong>${teamTotal}</strong></td>
  `;
  teamRoster.appendChild(totalRow);
}

// Populate Team Dropdown
function populateTeamDropdown() {
  const teamSelect = document.getElementById("team-select");
  teamSelect.innerHTML = "";

  Object.keys(standingsData.teams).forEach((team) => {
    const option = document.createElement("option");
    option.value = team;
    option.textContent = team;
    teamSelect.appendChild(option);
  });

  teamSelect.addEventListener("change", loadTeamPage);
  loadTeamPage();
}

// Populate Week Dropdown
function populateWeekDropdown() {
  const weekSelect = document.getElementById("week-select");
  if (!weekSelect) {
    console.warn("Week select element not found");
    return;
  }

  console.log("Populating week dropdown with data:", standingsData.weeks); // Debug log

  weekSelect.innerHTML = "";

  // Add default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select a Week";
  weekSelect.appendChild(defaultOption);

  if (standingsData.weeks && standingsData.weeks.length > 0) {
    standingsData.weeks.forEach((week) => {
      if (week && week.track && week.track.trim() !== "") {
        const option = document.createElement("option");
        option.value = week.week;
        option.textContent = `Week ${week.week} - ${week.track}`;
        weekSelect.appendChild(option);
        console.log(`Added week option: ${option.textContent}`); // Debug log
      }
    });

    // Set to the latest week with data
    const latestWeek = findLatestWeekWithData();
    if (latestWeek) {
      weekSelect.value = latestWeek;
      console.log(`Set to latest week: ${latestWeek}`); // Debug log
      loadWeeklyStandings();
      updateTrackImage();
    }
  } else {
    console.warn("No weeks data available");
  }

  // Add change event listener
  weekSelect.addEventListener("change", () => {
    const selectedWeek = weekSelect.value;
    console.log(`Week selection changed to: ${selectedWeek}`); // Debug log
    if (selectedWeek) {
      loadWeeklyStandings();
      generateWeeklyRecap();
      updateTrackImage();
    }
  });
}

// Helper function to find latest week with data
function findLatestWeekWithData() {
  if (!standingsData.weeks || standingsData.weeks.length === 0) {
    return null;
  }

  for (let i = standingsData.weeks.length - 1; i >= 0; i--) {
    const week = standingsData.weeks[i];
    if (week && week.track && Object.keys(week.standings).length > 0) {
      return week.week;
    }
  }

  return standingsData.weeks[0].week; // Default to first week if no other valid week found
}

// Add this new function to handle track images
function updateTrackImage() {
  const weekSelect = document.getElementById("week-select");
  const trackImage = document.getElementById("track-image");
  const selectionContainer = document.getElementById("selection-container");
  
  // Create or update the selection container styling
  if (!selectionContainer) {
    const container = document.createElement("div");
    container.id = "selection-container";
    container.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: start;
      gap: 40px;
      margin: 20px auto;
      width: 100%;
    `;
    
    // Create left and right containers
    const leftContainer = document.createElement("div");
    leftContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    `;
    
    const rightContainer = document.createElement("div");
    rightContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    `;
    
    // Move elements to their containers
    if (weekSelect) {
      weekSelect.style.cssText = `
        padding: 8px;
        margin-bottom: 10px;
        width: 200px;
      `;
      leftContainer.appendChild(weekSelect);
    }
    
    if (trackImage) {
      trackImage.style.cssText = `
        width: 200px;
        height: auto;
        border-radius: 8px;
      `;
      leftContainer.appendChild(trackImage);
    }
    
    const teamSelect = document.getElementById("team-select");
    const teamImage = document.getElementById("team-image");
    
    if (teamSelect) {
      teamSelect.style.cssText = `
        padding: 8px;
        margin-bottom: 10px;
        width: 200px;
      `;
      rightContainer.appendChild(teamSelect);
    }
    
    if (teamImage) {
      teamImage.style.cssText = `
        width: 200px;
        height: auto;
        border-radius: 8px;
      `;
      rightContainer.appendChild(teamImage);
    }
    
    container.appendChild(leftContainer);
    container.appendChild(rightContainer);
    
    // Insert the container in the correct location
    const weeklyContent = document.getElementById("weekly");
    if (weeklyContent) {
      weeklyContent.insertBefore(container, weeklyContent.firstChild);
    }
  }
  
  // Update track image
  if (trackImage && weekSelect.value) {
    const selectedWeek = standingsData.weeks.find(week => week.week === parseInt(weekSelect.value, 10));
    if (selectedWeek && selectedWeek.track) {
      const trackName = selectedWeek.track.replace(/[^a-zA-Z0-9]/g, '_');
      const trackImageUrl = `https://raw.githubusercontent.com/nothinbutnet31/NASCAR/main/images/tracks/${trackName}.png`;
      trackImage.src = trackImageUrl;
      trackImage.alt = `${selectedWeek.track} Track`;
      trackImage.onerror = function() {
        this.src = "https://via.placeholder.com/200";
        console.warn(`Track image not found for ${selectedWeek.track}`);
      };
    }
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
  if (!isDataLoaded || !standingsData.weeks || standingsData.weeks.length === 0) {
    console.warn("Data not fully loaded yet.");
    return;
  }

  console.log("Initializing with weeks data:", standingsData.weeks); // Debug log

  // Load overall standings first
  loadOverallStandings();

  // Populate the week dropdown
  populateWeekDropdown();

  // Find the latest week with data
  const latestWeek = findLatestWeekWithData();
  console.log("Latest week found:", latestWeek); // Debug log
  
  // Set the week select dropdown to the latest week with data
  const weekSelect = document.getElementById("week-select");
  if (weekSelect) {
    weekSelect.value = latestWeek;
    console.log("Set week select value to:", latestWeek); // Debug log
  }

  // Load weekly standings and recap for the latest week
  loadWeeklyStandings();
  generateWeeklyRecap();
  updateTrackImage(); // Make sure to update track image

  // When the week selection changes, update everything
  if (weekSelect) {
    weekSelect.addEventListener("change", () => {
      console.log("Week selection changed to:", weekSelect.value); // Debug log
      loadWeeklyStandings();
      generateWeeklyRecap();
      updateTrackImage();
    });
  }

  // Initialize team page
  populateTeamDropdown();
  loadTeamPage();

  // Set weekly standings as default tab
  openTab('weekly');
}

// Make sure window.onload is properly set
window.onload = () => {
  console.log("Window loaded, fetching data..."); // Debug log
  fetchDataFromGoogleSheets();
  // Set weekly tab as active by default
  const weeklyTab = document.querySelector('[onclick="openTab(\'weekly\')"]');
  if (weeklyTab) {
    weeklyTab.classList.add('active');
  }
  const weeklyContent = document.getElementById('weekly');
  if (weeklyContent) {
    weeklyContent.style.display = 'block';
  }
};
