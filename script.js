// Constants and Initial Data
const sheetId = "19LbY1UwCkPXyVMMnvdu_KrYpyi6WhNcfuC6wjzxeBLI";
const apiKey = "AIzaSyDWBrtpo54AUuVClU49k0FdrLl-IFPpMdY";
const driversRange = "Drivers!A1:AA45";

let isDataLoaded = false;

const scoringSystem = {
  "1st": 38, "2nd": 35, "3rd": 34, "4th": 33, "5th": 32,
  "6th": 31, "7th": 30, "8th": 29, "9th": 28, "10th": 27,
  "11th": 26, "12th": 25, "13th": 24, "14th": 23, "15th": 22,
  "16th": 21, "17th": 20, "18th": 19, "19th": 18, "20th": 17,
  "21st": 16, "22nd": 15, "23rd": 14, "24th": 13, "25th": 12,
  "26th": 11, "27th": 10, "28th": 9, "29th": 8, "30th": 7,
  "31st": 6, "32nd": 5, "33rd": 4, "34th": 3, "35th": 2,
  "36th": 1, "37th": 1, "38th": 1, "39th": 1, "40th": 1,
  "Fastest Lap": 1, "Stage 1 Winner": 2, "Stage 2 Winner": 2, "Pole Winner": 1
};

let standingsData = {
  weeks: [],
  teams: {
    Midge: {
      drivers: ["Denny Hamlin", "William Byron", "Ricky Stenhouse Jr", "Ryan Preece", "Shane van Gisbergen"]
    },
    Emilia: { 
      drivers: ["Austin Cindric", "Austin Dillon", "Kyle Larson", "AJ Allmendinger", "Alex Bowman"]
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

// Add this new function to calculate Driver of the Week score
function calculateDriverOfTheWeek(weekData, selectedWeekNumber) {
  const allDriversPerformance = [];
  
  // Get previous averages if not first week
  const previousAverages = selectedWeekNumber > 1 ? 
    calculateDriverAverages(selectedWeekNumber - 1) : {};

  Object.entries(weekData.standings).forEach(([team, data]) => {
    const teamTotal = data.total;
    
    Object.entries(data.drivers).forEach(([driver, points]) => {
      if (points === 0) return; // Skip drivers with no points

      // Base score starts lower to give other factors more impact
      let totalScore = points * 0.7; // Reduce base points weight to 70%

      // Add bonus for performing above average (if not first week)
      if (previousAverages[driver]) {
        const averagePerformance = previousAverages[driver];
        const performanceBonus = points - averagePerformance;
        totalScore += (performanceBonus * 0.8); // Increase weight to 80%
      }

      // Add bonus for stage wins and fastest lap
      const stagePoints = calculateStagePoints(driver, weekData);
      totalScore += (stagePoints * 0.6); // Increase weight to 60%

      // Add bonus for qualifying performance
      const qualifyingBonus = calculateQualifyingBonus(driver, weekData);
      totalScore += (qualifyingBonus * 0.4); // Increase weight to 40%

      // Add bonus for fastest lap
      const fastestLapBonus = calculateFastestLapBonus(driver, weekData);
      totalScore += (fastestLapBonus * 0.3); // Increase weight to 30%

      // Calculate percentage of team's points
      const teamContribution = (points / teamTotal) * 100;
      totalScore += (teamContribution * 0.4); // Increase weight to 40%

      allDriversPerformance.push({
        driver,
        team,
        racePoints: points,
        totalScore: parseFloat(totalScore.toFixed(1)),
        details: {
          stagePoints,
          qualifyingBonus,
          fastestLapBonus,
          teamContribution: teamContribution.toFixed(1) + '%',
          aboveAverage: previousAverages[driver] ? 
            (points - previousAverages[driver]).toFixed(1) : 'N/A'
        }
      });
    });
  });

  // Sort by total score and return the highest
  return allDriversPerformance.sort((a, b) => b.totalScore - a.totalScore)[0];
}

// Helper function to calculate stage points
function calculateStagePoints(driver, weekData) {
  let stagePoints = 0;
  Object.values(weekData.standings).forEach(teamData => {
    Object.entries(teamData.drivers).forEach(([driverName, points]) => {
      if (driverName === driver) {
        // Look specifically for stage wins in the data
        if (points === scoringSystem["Stage 1 Winner"]) {
          stagePoints += scoringSystem["Stage 1 Winner"];
        }
        if (points === scoringSystem["Stage 2 Winner"]) {
          stagePoints += scoringSystem["Stage 2 Winner"];
        }
      }
    });
  });
  return stagePoints;
}

// Helper function to calculate qualifying bonus
function calculateQualifyingBonus(driver, weekData) {
  let qualifyingBonus = 0;
  Object.values(weekData.standings).forEach(teamData => {
    Object.entries(teamData.drivers).forEach(([driverName, points]) => {
      if (driverName === driver) {
        // Look specifically for pole position
        if (points === scoringSystem["Pole Winner"]) {
          qualifyingBonus += scoringSystem["Pole Winner"];
        }
      }
    });
  });
  return qualifyingBonus;
}

// Helper function for fastest lap bonus
function calculateFastestLapBonus(driver, weekData) {
  let fastestLapBonus = 0;
  Object.values(weekData.standings).forEach(teamData => {
    Object.entries(teamData.drivers).forEach(([driverName, points]) => {
      if (driverName === driver) {
        // Look specifically for fastest lap
        if (points === scoringSystem["Fastest Lap"]) {
          fastestLapBonus += scoringSystem["Fastest Lap"];
        }
      }
    });
  });
  return fastestLapBonus;
}

// Update generateWeeklyRecap to remove total score display
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

  // Updated Driver of the Week section with narrative format
  const driverOfTheWeek = calculateDriverOfTheWeek(weekData, selectedWeekNumber);
  const driverImageName = driverOfTheWeek.driver.replace(/[^a-zA-Z0-9]/g, '_');
  
  // Helper function to get finishing position
  const getFinishPosition = (points) => {
    for (const [position, value] of Object.entries(scoringSystem)) {
      if (value === points && (position.includes('st') || position.includes('nd') || 
          position.includes('rd') || position.includes('th'))) {
        return position;
      }
    }
    return 'Unknown position';
  };

  // Build narrative description
  let achievements = [];
  let description = `Finished in ${getFinishPosition(driverOfTheWeek.racePoints)}`;
  
  if (driverOfTheWeek.details.stagePoints > 0) {
    const stageWins = [];
    if (driverOfTheWeek.details.stagePoints >= scoringSystem["Stage 1 Winner"]) stageWins.push("Stage 1");
    if (driverOfTheWeek.details.stagePoints >= scoringSystem["Stage 2 Winner"]) stageWins.push("Stage 2");
    achievements.push(`Won ${stageWins.join(" and ")}`);
  }
  
  if (driverOfTheWeek.details.qualifyingBonus > 0) {
    achievements.push("Started from pole position");
  }
  
  if (driverOfTheWeek.details.fastestLapBonus > 0) {
    achievements.push("Set the fastest lap of the race");
  }

  // Add performance vs average if not first race
  if (driverOfTheWeek.details.aboveAverage !== 'N/A') {
    const diff = parseFloat(driverOfTheWeek.details.aboveAverage);
    if (diff > 0) {
      achievements.push(`Scored ${diff.toFixed(1)} points above their season average`);
    }
  }

  // Add team contribution
  achievements.push(`Contributed ${driverOfTheWeek.details.teamContribution} of their team's points`);

  // Combine into narrative
  if (achievements.length > 0) {
    description += `. ${achievements.join(". ")}.`;
  }
  
  recapText += `<div class="recap-section">
    <h4>🌟 Driver of the Week</h4>
    <div style="display: flex; align-items: start; gap: 20px;">
      <div style="flex: 0 0 auto;">
        <img 
          src="https://raw.githubusercontent.com/nothinbutnet31/NASCAR/main/images/drivers/${driverImageName}.png" 
          alt="${driverOfTheWeek.driver}"
          style="width: 150px; height: auto; border-radius: 8px;"
          onerror="this.src='https://via.placeholder.com/150'; this.onerror=null;"
        />
      </div>
      <div style="flex: 1;">
        <p style="font-size: 1.2em; margin-bottom: 15px;">
          <strong>${driverOfTheWeek.driver}</strong> (${driverOfTheWeek.team})
        </p>
        <p style="line-height: 1.6; margin-bottom: 10px;">${description}</p>
      </div>
    </div>
  </div>`;

  // Top and Bottom Performers Section
  const allDriversScores = [];
  Object.entries(weekData.standings).forEach(([team, data]) => {
    Object.entries(data.drivers).forEach(([driver, points]) => {
      allDriversScores.push({ team, driver, points });
    });
  });

  const sortedDrivers = allDriversScores.sort((a, b) => b.points - a.points);
  const topDrivers = sortedDrivers.slice(0, 3);
  const bottomDrivers = sortedDrivers.filter(d => d.points > 0).slice(-3).reverse();

  recapText += `<div class="recap-section">
    <h4>🏆 Top Performers</h4>
    <p><strong>${sortedDrivers[0].driver}</strong> led all drivers with ${sortedDrivers[0].points} points!</p>
    <ul>`;
  topDrivers.forEach(({ driver, team, points }) => {
    recapText += `<li>${driver} (${team}) - ${points} points</li>`;
  });
  recapText += `</ul>`;

  if (bottomDrivers.length > 0) {
    recapText += `<h4>📉 Struggling Drivers</h4><ul>`;
    bottomDrivers.forEach(({ driver, team, points }) => {
      recapText += `<li>${driver} (${team}) - ${points} points</li>`;
    });
    recapText += `</ul>`;
  }
  recapText += `</div>`;

  // Over/Under Performers (compared to previous races)
  if (selectedWeekNumber > 1) {
    const driverAverages = calculateDriverAverages(selectedWeekNumber - 1);
    const performanceDeltas = [];

    allDriversScores.forEach(({ driver, team, points }) => {
      if (points > 0 && driverAverages[driver]) {
        const delta = points - driverAverages[driver];
        performanceDeltas.push({ driver, team, points, delta });
      }
    });

    const sortedDeltas = performanceDeltas.sort((a, b) => b.delta - a.delta);
    const overAchiever = sortedDeltas[0];
    const underPerformer = sortedDeltas[sortedDeltas.length - 1];

    recapText += `<div class="recap-section">
      <h4>📈 Performance vs Average</h4>`;
    
    if (overAchiever) {
      recapText += `<p><strong>Over Achiever:</strong> ${overAchiever.driver} (${overAchiever.team})<br>
        Scored ${overAchiever.points} points, ${overAchiever.delta.toFixed(1)} above their average</p>`;
    }
    
    if (underPerformer) {
      recapText += `<p><strong>Under Performer:</strong> ${underPerformer.driver} (${underPerformer.team})<br>
        Scored ${underPerformer.points} points, ${Math.abs(underPerformer.delta).toFixed(1)} below their average</p>`;
    }
    recapText += `</div>`;
  }

  // Championship Movement
  if (selectedWeekNumber > 1) {
    const previousStandings = calculateStandingsAfterWeek(selectedWeekNumber - 1);
    const currentStandings = calculateStandingsAfterWeek(selectedWeekNumber);
    
    const movements = calculatePositionChanges(previousStandings, currentStandings);
    const significantMovements = movements.filter(m => m.positionChange !== 0);

    if (significantMovements.length > 0) {
      recapText += `<div class="recap-section">
        <h4>🔄 Championship Movement</h4>
        <ul>`;
      significantMovements.forEach(({ team, positionChange }) => {
        const direction = positionChange > 0 ? "up" : "down";
        recapText += `<li>${team} moved ${direction} ${Math.abs(positionChange)} position${Math.abs(positionChange) > 1 ? 's' : ''}</li>`;
      });
      recapText += `</ul></div>`;
    }
  }

  recapContainer.innerHTML = recapText;
}

// Helper function to calculate driver averages up to a specific week
function calculateDriverAverages(upToWeek) {
  const driverPoints = {};
  const driverRaces = {};

  for (let i = 0; i < upToWeek; i++) {
    const week = standingsData.weeks[i];
    if (week) {
      Object.values(week.standings).forEach(teamData => {
        Object.entries(teamData.drivers).forEach(([driver, points]) => {
          if (points > 0) {
            driverPoints[driver] = (driverPoints[driver] || 0) + points;
            driverRaces[driver] = (driverRaces[driver] || 0) + 1;
          }
        });
      });
    }
  }

  const averages = {};
  Object.keys(driverPoints).forEach(driver => {
    if (driverRaces[driver] > 0) {
      averages[driver] = driverPoints[driver] / driverRaces[driver];
    }
  });

  return averages;
}

// Helper function to calculate standings after a specific week
function calculateStandingsAfterWeek(weekNumber) {
  const totalPoints = {};
  
  for (let i = 0; i < weekNumber; i++) {
    const week = standingsData.weeks[i];
    if (week) {
      Object.entries(week.standings).forEach(([team, data]) => {
        totalPoints[team] = (totalPoints[team] || 0) + data.total;
      });
    }
  }
  
  return Object.entries(totalPoints)
    .sort((a, b) => b[1] - a[1])
    .map(([team], index) => ({ team, position: index + 1 }));
}

// Helper function to calculate position changes
function calculatePositionChanges(previousStandings, currentStandings) {
  return currentStandings.map(current => {
    const previous = previousStandings.find(p => p.team === current.team);
    const positionChange = previous ? previous.position - current.position : 0;
    return {
      team: current.team,
      positionChange
    };
  });
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
  const trackSelect = document.getElementById("track-select");
  const teamRoster = document.querySelector("#team-roster tbody");
  const teamImage = document.getElementById("team-image");
  const trackImage = document.getElementById("track-image");

  // Remove any existing containers to prevent duplication
  const existingContainer = document.querySelector("#team-selection-container");
  if (existingContainer) {
    existingContainer.remove();
  }

  // Create container for selects and images
  const selectImageContainer = document.createElement("div");
  selectImageContainer.id = "team-selection-container"; // Add ID for easy removal
  selectImageContainer.style.cssText = `
    display: flex;
    justify-content: center;
    gap: 40px;
    margin: 20px 0;
  `;

  // Create left container for team select and image
  const teamContainer = document.createElement("div");
  teamContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  `;

  // Create right container for track select and image
  const trackContainer = document.createElement("div");
  trackContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  `;

  // Style the select elements
  if (teamSelect && trackSelect) {
    teamSelect.style.cssText = `
      padding: 8px;
      width: 200px;
    `;
    trackSelect.style.cssText = `
      padding: 8px;
      width: 200px;
    `;

    teamContainer.appendChild(teamSelect);
    if (teamImage) {
      teamImage.style.width = '200px';
      teamContainer.appendChild(teamImage);
    }

    trackContainer.appendChild(trackSelect);
    if (trackImage) {
      trackImage.style.width = '200px';
      trackContainer.appendChild(trackImage);
    }

    selectImageContainer.appendChild(teamContainer);
    selectImageContainer.appendChild(trackContainer);

    // Insert after the title
    const teamContent = document.getElementById("teams");
    const title = teamContent.querySelector("h2");
    if (title) {
      title.insertAdjacentElement('afterend', selectImageContainer);
    }
  }

  if (!teamSelect || !teamSelect.value) {
    console.warn("No team selected.");
    return;
  }

  const selectedTeam = teamSelect.value;

  // Populate track select dropdown
  if (trackSelect) {
    trackSelect.innerHTML = "";
    
    // Add "All Races" option
    const allRacesOption = document.createElement("option");
    allRacesOption.value = "";
    allRacesOption.textContent = "All Races";
    trackSelect.appendChild(allRacesOption);

    // Add each track with valid points
    standingsData.weeks.forEach((week, index) => {
      const hasValidPoints = week.standings[selectedTeam]?.total > 0;

      if (week && week.track && week.track.trim() !== "" && hasValidPoints) {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = week.track;
        trackSelect.appendChild(option);
      }
    });

    // Set initial value to "All Races" and update track image
    trackSelect.value = "";
    updateTrackImageForTeamPage("");

    // Add change event listener (only once)
    trackSelect.removeEventListener("change", trackSelect.changeHandler);
    trackSelect.changeHandler = () => {
      updateTeamRoster(selectedTeam, trackSelect.value);
      updateTrackImageForTeamPage(trackSelect.value);
    };
    trackSelect.addEventListener("change", trackSelect.changeHandler);
  }

  // Update team image
  if (teamImage) {
    const teamImageName = selectedTeam.replace(/[^a-zA-Z0-9]/g, "_");
    const teamImageUrl = `https://raw.githubusercontent.com/nothinbutnet31/NASCAR/main/images/teams/${teamImageName}.png`;
    teamImage.src = teamImageUrl;
    teamImage.alt = `${selectedTeam} Logo`;
    teamImage.onerror = function() {
      this.src = "https://via.placeholder.com/100";
    };
  }

  // Update roster based on selected track or all races
  updateTeamRoster(selectedTeam, trackSelect ? trackSelect.value : "");
}

function updateTeamRoster(selectedTeam, selectedTrackIndex) {
  const teamRoster = document.querySelector("#team-roster tbody");
  if (!teamRoster) return;

  teamRoster.innerHTML = "";
  const drivers = standingsData.teams[selectedTeam].drivers;
  
  drivers.forEach(driver => {
    const row = document.createElement("tr");
    let points = 0;

    if (selectedTrackIndex === "") {
      // Calculate total points across all races
      points = standingsData.weeks.reduce((sum, week) => {
        return sum + (week.standings[selectedTeam]?.drivers[driver] || 0);
      }, 0);
    } else {
      // Get points for specific race
      const week = standingsData.weeks[selectedTrackIndex];
      if (week && week.standings[selectedTeam]?.drivers[driver]) {
        points = week.standings[selectedTeam].drivers[driver];
      }
    }

    row.innerHTML = `
      <td>${driver}</td>
      <td>${points}</td>
    `;
    teamRoster.appendChild(row);
  });
}

// Add new function to update track image in team page
function updateTrackImageForTeamPage(selectedTrackIndex) {
  const trackImage = document.getElementById("track-image");
  if (!trackImage) return;

  if (selectedTrackIndex === "") {
    const allRacesImageUrl = `https://raw.githubusercontent.com/nothinbutnet31/NASCAR/main/images/tracks/All_Races.png`;
    trackImage.src = allRacesImageUrl;
    trackImage.alt = "All Races";
    trackImage.onerror = function() {
      this.src = "https://via.placeholder.com/200";
      console.warn("All Races image not found");
    };
    return;
  }

  const selectedWeek = standingsData.weeks[selectedTrackIndex];
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

  weekSelect.innerHTML = "";

  // Add default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select a Week";
  weekSelect.appendChild(defaultOption);

  let validWeeks = [];

  if (standingsData.weeks && standingsData.weeks.length > 0) {
    standingsData.weeks.forEach((week) => {
      // Check if the week has any valid points
      const hasValidPoints = Object.values(week.standings).some(teamData => 
        teamData.total > 0
      );

      if (week && week.track && week.track.trim() !== "" && hasValidPoints) {
        validWeeks.push(week);
        const option = document.createElement("option");
        option.value = week.week;
        option.textContent = `Week ${week.week} - ${week.track}`;
        weekSelect.appendChild(option);
      }
    });

    // Find the last week with valid points
    const lastValidWeek = validWeeks[validWeeks.length - 1];

    if (lastValidWeek) {
      weekSelect.value = lastValidWeek.week;
      loadWeeklyStandings();
      updateTrackImage();
    }
  }

  weekSelect.addEventListener("change", () => {
    loadWeeklyStandings();
    generateWeeklyRecap();
    updateTrackImage();
  });
}

// Add this new function to handle track images
function updateTrackImage() {
  const weekSelect = document.getElementById("week-select");
  const trackImage = document.getElementById("track-image");
  
  if (!trackImage || !weekSelect.value) return;

  const selectedWeek = standingsData.weeks.find(week => week.week === parseInt(weekSelect.value, 10));
  if (selectedWeek && selectedWeek.track) {
    const trackName = selectedWeek.track.replace(/[^a-zA-Z0-9]/g, '_');
    const trackImageUrl = `https://raw.githubusercontent.com/nothinbutnet31/NASCAR/main/images/tracks/${trackName}.png`;
    trackImage.src = trackImageUrl;
    trackImage.alt = `${selectedWeek.track} Track`;
    trackImage.onerror = function() {
      this.src = "https://via.placeholder.com/200";
    };
  }
}

// Open Tabs (for switching between pages/sections)
function openTab(tabName) {
  const tabcontents = document.querySelectorAll(".tabcontent");
  const tablinks = document.querySelectorAll(".tablink");

  tabcontents.forEach(tab => tab.style.display = "none");
  tablinks.forEach(link => link.classList.remove("active"));

  document.getElementById(tabName).style.display = "block";
  document.querySelector(`[onclick="openTab('${tabName}')"]`).classList.add("active");

  if (tabName === "weekly") {
    populateWeekDropdown();
    loadWeeklyStandings();
  } else if (tabName === "teams") {
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

  // Set weekly tab as default and initialize it
  openTab('weekly');
}

// Make sure window.onload is properly set
window.onload = () => {
  console.log("Window loaded, fetching data...");
  fetchDataFromGoogleSheets();
};
