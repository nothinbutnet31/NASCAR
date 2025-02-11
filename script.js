// Constants and Initial Data
const sheetId = "19LbY1UwCkPXyVMMnvdu_KrYpyi6WhNcfuC6wjzxeBLI";
const apiKey = "AIzaSyDWBrtpo54AUuVClU49k0FdrLl-IFPpMdY";
const driversRange = "Drivers!A1:AA45";

let isDataLoaded = false;

window.scoringSystem = {
  "1st": 38, "2nd": 34, "3rd": 33, "4th": 32, "5th": 31,
  "6th": 30, "7th": 29, "8th": 28, "9th": 27, "10th": 26,
  "11th": 25, "12th": 24, "13th": 23, "14th": 22, "15th": 21,
  "16th": 20, "17th": 19, "18th": 18, "19th": 17, "20th": 16,
  "21st": 15, "22nd": 14, "23rd": 13, "24th": 12, "25th": 11,
  "26th": 10, "27th": 9, "28th": 8, "29th": 7, "30th": 6,
  "31st": 5, "32nd": 4, "33rd": 3, "34th": 2, "35th": 1,
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

// Add this constant for expected averages
const expectedDriverAverages = {
  // Top tier drivers (25+ avg)
  "Kyle Larson": 28,
  "William Byron": 27,
  "Ryan Blaney": 26,
  "Christopher Bell": 26,
  "Denny Hamlin": 25,
  
  
  // Strong performers (20-24 avg)
  "Tyler Reddick": 24,
  "Ross Chastain": 23,
  "Joey Logano": 23,
  "Brad Keselowski": 22,
  "Chase Elliott": 24,
  "Chris Buescher": 21,
  "Bubba Wallace": 20,
  
  // Mid tier (15-19 avg)
  "Kyle Busch": 19,
  "Alex Bowman": 19,
  "Daniel Suarez": 18,
  "Chase Briscoe": 17,
  "Ty Gibbs": 17,
  "Austin Cindric": 17,
  "Carson Hocevar": 17,
  "Erik Jones": 17,
  "Austin Dillon": 16,
  "Ryan Preece": 15,
  "Michael McDowell": 15,
  "Shane van Gisbergen": 15,
  // Development/Others (10-14 avg)
  "Josh Berry": 14,
  "Ricky Stenhouse Jr": 13,
  "Riley Herbst": 13,
  "AJ Allmendinger": 13,
  "Cole Custer": 13,
  "Todd Gilliland": 12,
  "Justin Haley": 12,
  "Harrison Burton": 11,
  "Noah Gragson": 10,
  "Corey LaJoie": 10
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
    
    // Wait for DOM to be ready before initializing
    if (document.readyState === 'complete') {
      init();
    } else {
      window.addEventListener('load', init);
    }
    
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

  // Add CSS if it doesn't exist
  if (!document.getElementById('standings-styles')) {
    const styles = document.createElement('style');
    styles.id = 'standings-styles';
    styles.innerHTML = `
      #overall-standings {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      
      #overall-standings th,
      #overall-standings td {
        text-align: center !important;
        padding: 10px;
        border: 1px solid #ddd;
      }
      
      #overall-standings th {
        background-color: #1976D2;  // Changed to match tab blue color
        color: white;  // White text for better contrast
        font-weight: bold;
      }
      
      #overall-standings tr:nth-child(even) {
        background-color: #f9f9f9;
      }
      
      #overall-standings tr:hover {
        background-color: #f0f0f0;
      }
      
      .standings-cell {
        text-align: center !important;
        vertical-align: middle !important;
      }
    `;
    document.head.appendChild(styles);
  }

  // Calculate total points for each team
  const totalPoints = {};
  
  console.log("Teams data:", standingsData.teams);
  
  if (!standingsData || !standingsData.teams) {
    console.error("No standings data available");
    return;
  }

  Object.keys(standingsData.teams).forEach(team => {
    totalPoints[team] = 0;
  });

  console.log("Processing weekly data...");
  if (standingsData.weeks) {
    standingsData.weeks.forEach(week => {
      Object.entries(week.standings).forEach(([team, data]) => {
        if (data && data.total) {
          totalPoints[team] = (totalPoints[team] || 0) + data.total;
        }
      });
    });
  }

  console.log("Total points calculated:", totalPoints);

  const sortedTeams = Object.entries(totalPoints)
    .sort((a, b) => b[1] - a[1]);

  console.log("Sorted teams:", sortedTeams);

  sortedTeams.forEach(([team, points], index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="standings-cell">${index + 1}</td>
      <td class="standings-cell">${team}</td>
      <td class="standings-cell">${points}</td>
    `;
    overallTable.appendChild(row);
  });
  
  console.log("Finished loading standings");
}

// Load Weekly Standings
function loadWeeklyStandings() {
  const weekSelect = document.getElementById("week-select");
  const weeklyTable = document.querySelector("#weekly-standings tbody");
  
  if (!weekSelect || !weekSelect.value || !weeklyTable) {
    console.log("Required elements not ready:", {
      weekSelect: !!weekSelect,
      weekSelectValue: weekSelect?.value,
      weeklyTable: !!weeklyTable
    });
    return;
  }

  console.log("Loading weekly standings...");
  const selectedWeekNumber = parseInt(weekSelect.value, 10);
  weeklyTable.innerHTML = "";

  const weekData = standingsData.weeks.find((week) => week.week === selectedWeekNumber);

  if (weekData) {
    // Update track image
    const trackImage = document.getElementById("weekly-track-image");
    if (trackImage && weekData.track) {
      console.log('Original track name:', weekData.track);
      const trackName = weekData.track.toLowerCase().replace(/\s+/g, '_');
      console.log('Transformed track name:', trackName);
      
      const trackUrl = `https://raw.githubusercontent.com/nothinbutnet31/NASCAR/main/images/tracks/${trackName}.png`;
      console.log('Track image URL:', trackUrl);
      
      trackImage.src = trackUrl;
      trackImage.alt = `${weekData.track} Track`;
      trackImage.style.maxWidth = "200px";
      trackImage.style.display = "block";
      trackImage.style.margin = "10px 0";
      
      trackImage.onerror = function() {
        console.log('Track image failed to load:', trackUrl);
        this.src = "https://via.placeholder.com/200x200?text=Track+Image+Not+Found";
      };
    }

    const sortedStandings = Object.entries(weekData.standings)
      .sort((a, b) => b[1].total - a[1].total);

    sortedStandings.forEach(([team, data], index) => {
      const row = document.createElement("tr");
      const flag = index === 0 && data.total > 0 ? '<i class="fas fa-flag-checkered"></i> ' : "";
      row.innerHTML = `
        <td>${flag}${team}</td>
        <td>${data.total}</td>
      `;
      weeklyTable.appendChild(row);
    });

    // Generate weekly recap
    const recapDiv = document.getElementById("weekly-recap");
    if (recapDiv) {
      let recap = `<h3>Week ${selectedWeekNumber} - ${weekData.track}</h3>`;
      recap += `<p>Race Results:</p><ul>`;
      
      sortedStandings.forEach(([team, data], index) => {
        const position = index + 1;
        const suffix = position === 1 ? "st" : position === 2 ? "nd" : position === 3 ? "rd" : "th";
        recap += `<li>${team} finished ${position}${suffix} with ${data.total} points</li>`;
      });
      
      recap += `</ul>`;
      recapDiv.innerHTML = recap;
    }
  }
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
    }
  }

  weekSelect.addEventListener("change", loadWeeklyStandings);
}

// Modify the calculateDriverAverages function
function calculateDriverAverages(weekNumber) {
  const averages = {};
  
  // If before week 6, use expected averages
  if (weekNumber < 6) {
    return expectedDriverAverages;
  }
  
  // After week 5, calculate actual averages
  Object.entries(standingsData.teams).forEach(([team, data]) => {
    data.drivers.forEach(driver => {
      let totalPoints = 0;
      let raceCount = 0;
      
      // Look at all weeks up to current week
      for (let i = 1; i <= weekNumber; i++) {
        const week = standingsData.weeks.find(w => w.week === i);
        if (week && week.standings[team]?.drivers[driver]) {
          totalPoints += week.standings[team].drivers[driver];
          raceCount++;
        }
      }
      
      if (raceCount > 0) {
        averages[driver] = parseFloat((totalPoints / raceCount).toFixed(1));
      } else {
        // Fallback to expected average if no races yet
        averages[driver] = expectedDriverAverages[driver] || 15; // Default to 15 if no expectation set
      }
    });
  });
  
  return averages;
}

// Update calculateDriverOfTheWeek to use this info
function calculateDriverOfTheWeek(weekData, selectedWeekNumber) {
  const allDriversPerformance = [];
  
  Object.entries(weekData.standings).forEach(([team, data]) => {
    Object.entries(data.drivers).forEach(([driver, racePoints]) => {
      if (racePoints === 0) return;

      // Calculate base race points (finish position only)
      let basePoints = 0;
      for (const [pos, pts] of Object.entries(scoringSystem)) {
        if (racePoints >= pts && (pos.includes('st') || pos.includes('nd') || 
            pos.includes('rd') || pos.includes('th'))) {
          basePoints = pts;
          break;
        }
      }

      let totalScore = basePoints * 0.8;

      // Check for stage wins
      const stagePoints = weekData.standings[team]?.drivers[driver] || 0;
      const stageWins = (stagePoints - basePoints) / 2; // Each stage win is worth 2 points

      // Check for pole and fastest lap
      const hadPole = weekData.positions?.find(row => 
        row[0] === "Pole Winner" && row[selectedWeekNumber] === driver);
      const hadFastestLap = weekData.positions?.find(row => 
        row[0] === "Fastest Lap" && row[selectedWeekNumber] === driver);

      // Add bonuses
      if (basePoints === 38) totalScore += 8; // Win bonus
      else if (basePoints >= 34) totalScore += 5; // Podium bonus
      else if (basePoints >= 31) totalScore += 3; // Top-5 bonus

      // Add stage, pole, and fastest lap points
      totalScore += (stageWins * 2 * 1.0); // Stage points weight
      if (hadPole) totalScore += (1 * 0.8); // Qualifying bonus weight
      if (hadFastestLap) totalScore += (1 * 0.8); // Fastest lap bonus weight

      // Calculate performance vs expectations
      const driverAverages = calculateDriverAverages(selectedWeekNumber);
      const expectedPoints = driverAverages[driver] || 15;
      const performanceBonus = racePoints - expectedPoints;
      if (performanceBonus > 0) {
        totalScore += (performanceBonus * 1.4);
      }

      // Calculate team contribution
      const teamContribution = (racePoints / data.total) * 100;
      totalScore += (teamContribution * 0.6);

      allDriversPerformance.push({
        driver,
        team,
        racePoints: racePoints,
        basePoints: basePoints,
        totalScore: parseFloat(totalScore.toFixed(1)),
        details: {
          stageWins: stageWins,
          hadPole: hadPole ? true : false,
          hadFastestLap: hadFastestLap ? true : false,
          teamContribution: teamContribution.toFixed(1) + '%',
          vsExpected: performanceBonus.toFixed(1)
        }
      });
    });
  });

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

// Add this helper function to check streaks
function checkStreaks(weekNumber) {
  const streaks = {
    hot: [], // Only drivers scoring 30+ in 3+ consecutive races
    cold: [] // Only drivers scoring under 10 in 3+ consecutive races
  };

  // Only check individual drivers
  Object.entries(standingsData.teams).forEach(([team, data]) => {
    data.drivers.forEach(driver => {
      let driverHotStreak = 0;
      let driverColdStreak = 0;

      // Look at last 3 races
      for (let i = weekNumber; i > weekNumber - 3 && i > 0; i--) {
        const week = standingsData.weeks.find(w => w.week === i);
        if (!week) continue;
        
        const driverScore = week.standings[team]?.drivers[driver] || 0;
        
        if (driverScore >= 30) {
          driverHotStreak++;
          driverColdStreak = 0;
        } else if (driverScore < 10) {
          driverColdStreak++;
          driverHotStreak = 0;
        } else {
          driverHotStreak = 0;
          driverColdStreak = 0;
        }
      }

      if (driverHotStreak >= 3) {
        streaks.hot.push({
          driver,
          team,
          streak: driverHotStreak,
          lastScore: standingsData.weeks.find(w => w.week === weekNumber)?.standings[team]?.drivers[driver]
        });
      }
      if (driverColdStreak >= 3) {
        streaks.cold.push({
          driver,
          team,
          streak: driverColdStreak,
          lastScore: standingsData.weeks.find(w => w.week === weekNumber)?.standings[team]?.drivers[driver]
        });
      }
    });
  });

  return streaks;
}

// Update generateWeeklyRecap to remove total score display
function generateWeeklyRecap() {
  const weekSelect = document.getElementById("week-select");
  const selectedWeekNumber = parseInt(weekSelect.value, 10);
  const weekData = standingsData.weeks.find((week) => week.week === selectedWeekNumber);
  const recapDiv = document.getElementById("weekly-recap");

  if (!weekData || !recapDiv) return;

  let recap = `<div class="weekly-recap-content">`;
  
  // Weekly Overview Section
  recap += `<h3>📊 Weekly Overview - ${weekData.track}</h3>`;
  
  // Top Team Performance
  const sortedTeams = Object.entries(weekData.standings)
    .sort((a, b) => b[1].total - a[1].total);
  const topTeam = sortedTeams[0];
  
  recap += `<div class="top-team-section">`;
  recap += `<h4>🏆 Top Team: ${topTeam[0]} (${topTeam[1].total} points)</h4>`;
  
  // Drivers over 30 points
  const highScoringDrivers = Object.entries(topTeam[1].drivers)
    .filter(([_, points]) => points >= 30)
    .sort((a, b) => b[1] - a[1]);
  
  if (highScoringDrivers.length > 0) {
    recap += `<p>⭐ Drivers scoring 30+ points:</p><ul>`;
    highScoringDrivers.forEach(([driver, points]) => {
      recap += `<li>${driver}: ${points} points 🔥</li>`;
    });
    recap += `</ul>`;
  }
  recap += `</div>`;

  // Top Driver Performance
  const allDriverPerformances = [];
  Object.entries(weekData.standings).forEach(([team, data]) => {
    Object.entries(data.drivers).forEach(([driver, points]) => {
      const expectedAvg = expectedDriverAverages[driver] || 15;
      const performance = ((points - expectedAvg) / expectedAvg * 100).toFixed(1);
      allDriverPerformances.push({ driver, points, performance: parseFloat(performance) });
    });
  });

  const topDriver = allDriverPerformances.sort((a, b) => b.points - a.points)[0];
  if (topDriver) {
    recap += `<div class="top-driver-section">`;
    recap += `<h4>🌟 Top Driver: ${topDriver.driver}</h4>`;
    recap += `<p>Points: ${topDriver.points}</p>`;
    recap += `<p>Performance: ${topDriver.performance > 0 ? '+' : ''}${topDriver.performance}% vs Expected</p>`;
    recap += `</div>`;
  }

  // Best and Worst Performers
  const bestPerformer = allDriverPerformances.sort((a, b) => b.performance - a.performance)[0];
  const worstPerformer = allDriverPerformances.sort((a, b) => a.performance - b.performance)[0];

  recap += `<div class="performance-section">`;
  recap += `<h4>📈 Performance Analysis</h4>`;
  recap += `<p>Overachiever: ${bestPerformer.driver} (${bestPerformer.performance > 0 ? '+' : ''}${bestPerformer.performance}%)</p>`;
  recap += `<p>Underachiever: ${worstPerformer.driver} (${worstPerformer.performance > 0 ? '+' : ''}${worstPerformer.performance}%)</p>`;
  recap += `</div>`;

  // Hot and Cold Streaks
  recap += `<div class="streaks-section">`;
  recap += `<h4>🔥 Hot & Cold Streaks</h4>`;
  
  // Calculate streaks (last 3 races)
  const streaks = calculateStreaks(selectedWeekNumber);
  
  if (streaks.hot.length > 0) {
    recap += `<p>Hot Streak: ${streaks.hot.join(', ')} 🔥</p>`;
  }
  if (streaks.cold.length > 0) {
    recap += `<p>Cold Streak: ${streaks.cold.join(', ')} ❄️</p>`;
  }
  
  recap += `</div>`;
  recap += `</div>`;

  recapDiv.innerHTML = recap;
}

function calculateStreaks(currentWeek) {
  const hot = [];
  const cold = [];
  const STREAK_THRESHOLD = 20; // Points above/below expected
  const RACES_TO_CHECK = 3;

  Object.entries(standingsData.teams).forEach(([team, teamData]) => {
    teamData.drivers.forEach(driver => {
      let recentPerformance = 0;
      let racesChecked = 0;

      // Check last 3 races
      for (let week = currentWeek; week > currentWeek - RACES_TO_CHECK && week > 0; week--) {
        const raceData = standingsData.weeks.find(w => w.week === week);
        if (raceData && raceData.standings[team]?.drivers[driver]) {
          const points = raceData.standings[team].drivers[driver];
          const expected = expectedDriverAverages[driver] || 15;
          recentPerformance += points - expected;
          racesChecked++;
        }
      }

      if (racesChecked >= 2) { // Need at least 2 races for a streak
        const avgPerformance = recentPerformance / racesChecked;
        if (avgPerformance >= STREAK_THRESHOLD) {
          hot.push(driver);
        } else if (avgPerformance <= -STREAK_THRESHOLD) {
          cold.push(driver);
        }
      }
    });
  });

  return { hot, cold };
}

// Helper function to calculate standings after a specific week
function calculateStandingsAfterWeek(weekNumber) {
  const totalPoints = {};
  
  // Initialize total points for each team
  Object.keys(standingsData.teams).forEach(team => {
    totalPoints[team] = 0;
  });

  // Calculate points up to the selected week
  standingsData.weeks
    .filter((week, index) => index < weekNumber)
    .forEach(week => {
      Object.entries(week.standings).forEach(([team, data]) => {
        totalPoints[team] += data.total;
      });
    });

  // Sort teams by points
  return Object.entries(totalPoints)
    .sort((a, b) => b[1] - a[1])
    .map(([team, points], position) => ({
      position: position + 1,
      team,
      points
    }));
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

// Open Tabs (for switching between pages/sections)
function openTab(tabName) {
  console.log("Opening tab:", tabName);
  const tabcontents = document.querySelectorAll(".tabcontent");
  const tablinks = document.querySelectorAll(".tablink");

  tabcontents.forEach(tab => tab.style.display = "none");
  tablinks.forEach(link => link.classList.remove("active"));

  const selectedTab = document.getElementById(tabName);
  if (selectedTab) {
    selectedTab.style.display = "block";
    const tabButton = document.querySelector(`[onclick="openTab('${tabName}')"]`);
    if (tabButton) {
      tabButton.classList.add("active");
    }
  }

  if (tabName === "teams") {
    populateTeamDropdown();
    loadTeamPage();
  }
}

// Initialize the Page after data is loaded
function init() {
  if (isDataLoaded) {
    console.log("Initializing with loaded data...");
    
    // First make sure the weekly tab is visible
    const weeklyTab = document.getElementById('weekly');
    if (weeklyTab) {
      weeklyTab.style.display = 'block';
      
      // Then initialize components after the tab is visible
      setTimeout(() => {
        console.log("Loading components...");
        
        // Create weekly recap div if it doesn't exist
        let recapDiv = document.getElementById("weekly-recap");
        if (!recapDiv) {
          recapDiv = document.createElement("div");
          recapDiv.id = "weekly-recap";
          const weeklyStandings = document.getElementById("weekly-standings");
          if (weeklyStandings) {
            weeklyStandings.parentNode.insertBefore(recapDiv, weeklyStandings.nextSibling);
          }
        }
        
        // Verify weekly table exists
        const weeklyTable = document.querySelector("#weekly-standings tbody");
        if (!weeklyTable) {
          // Create tbody if it doesn't exist
          const table = document.getElementById('weekly-standings');
          if (table) {
            const tbody = document.createElement('tbody');
            table.appendChild(tbody);
          }
        }
        
        loadOverallStandings();
        populateWeekDropdown();
        loadWeeklyStandings();
        createLiveNewsTicker();
        
        // Finally, open the weekly tab
        openTab('weekly');
      }, 200);
    } else {
      console.error("Weekly tab not found");
    }
  }
}

// Start when page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, fetching data...");
  fetchDataFromGoogleSheets();
});

// Add this function to fetch and display real NASCAR news
async function createLiveNewsTicker() {
  const tickerContainer = document.createElement('div');
  tickerContainer.id = 'news-ticker-container';
  tickerContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background-color: #FFD700;
    color: black;
    padding: 15px 0;
    z-index: 1000;
    overflow: hidden;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    font-size: 18px;
  `;

  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes ticker {
      0% { transform: translateX(0); }
      100% { transform: translateX(-100%); }
    }
    
    #news-ticker {
      white-space: nowrap;
      display: inline-block;
      animation: ticker 60s linear infinite;
      padding-left: 100%;
      font-size: 18px;
    }
    
    #news-ticker-container:hover #news-ticker {
      animation-play-state: paused;
    }
    
    body {
      padding-top: 50px;
    }
  `;
  document.head.appendChild(styleSheet);

  try {
    const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.motorsport.com%2Frss%2Fnascar-cup%2Fnews%2F&api_key=ooehn6ytnuvjctk6a9olwn5gjxf16e7gillph6jt&order_dir=desc&count=8');
    const data = await response.json();
    
    if (data && data.items && data.items.length > 0) {
      const ticker = document.createElement('div');
      ticker.id = 'news-ticker';
      
      const newsText = data.items
        .map(item => `<a href="${item.link}" target="_blank" style="color: black; text-decoration: none; font-weight: bold;">${item.title}</a>`)
        .join(' &nbsp;&nbsp;&bull;&nbsp;&nbsp; ');
      
      ticker.innerHTML = newsText + ' &nbsp;&nbsp;&bull;&nbsp;&nbsp; ';
      tickerContainer.appendChild(ticker);
    }
  } catch (error) {
    console.error('Error fetching NASCAR news:', error);
    const ticker = document.createElement('div');
    ticker.id = 'news-ticker';
    ticker.innerHTML = `
      <span style="color: black; font-weight: bold;">
        NASCAR News Loading... Please check back in a moment...
      </span>
    `;
    tickerContainer.appendChild(ticker);
  }

  document.body.insertBefore(tickerContainer, document.body.firstChild);
}

// Refresh news every 5 minutes
setInterval(async () => {
  const oldTicker = document.getElementById('news-ticker-container');
  if (oldTicker) {
    oldTicker.remove();
  }
  await createLiveNewsTicker();
}, 300000);




