
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
  "Fastest Lap": 1, "Stage 1 Winner": 2, "Stage 2 Winner": 2, "Pole Winner": 2
};

let standingsData = {
  weeks: [],
  teams: function(weekNumber) {
    if (weekNumber <= 12) {
      return {
        Midge: {
          drivers: ["Denny Hamlin", "William Byron", "Ricky Stenhouse", "Ryan Preece", "Shane Van Gisbergen"]
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
      };
    } else {
      return {
        Midge: {
          drivers: ["Denny Hamlin", "William Byron", "Ricky Stenhouse", "Ryan Preece", "Shane Van Gisbergen"]
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
      };
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
  "Shane Van Gisbergen": 15,
  // Development/Others (10-14 avg)
  "Josh Berry": 14,
  "Ricky Stenhouse": 13,
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
    await processRaceData(data.values);
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
  try {
    const headerRow = data[0];
    const positions = data.slice(1);

    standingsData.weeks = [];

    headerRow.slice(1).forEach((track, trackIndex) => {
      if (!track) return;

      const weekNumber = trackIndex + 1;
      const currentTeams = standingsData.teams(weekNumber);

      let raceResults = {
        track: track.trim(),
        week: weekNumber,
        standings: {}
      };

      Object.entries(currentTeams).forEach(([teamName, team]) => {
        let teamPoints = 0;
        let driverResults = {};

        team.drivers.forEach(driver => {
          let driverPoints = 0;

          positions.forEach(row => {
            const category = row[0];
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
  } catch (error) {
    console.error("Error processing race data:", error);
    throw error; // Re-throw the error to be caught by the calling function
  }
}


// Load Overall Standings
function loadOverallStandings() {
  const overallTable = document.querySelector("#overall-standings tbody");
  if (!overallTable) return;
  
  overallTable.innerHTML = "";

  // Get current week number and teams
  const weekSelect = document.getElementById("week-select");
  const weekNumber = weekSelect ? parseInt(weekSelect.value) : 1;
  const currentTeams = standingsData.teams(weekNumber);

  // Calculate total points for each team
  const totalPoints = {};
  
  // Initialize total points for each team
  Object.keys(currentTeams).forEach(team => {
    totalPoints[team] = 0;
  });

  if (standingsData.weeks) {
    standingsData.weeks.forEach(week => {
      Object.entries(week.standings).forEach(([team, data]) => {
        if (data && data.total) {
          totalPoints[team] = (totalPoints[team] || 0) + data.total;
        }
      });
    });
  }

  // Sort teams by points
  const sortedTeams = Object.entries(totalPoints)
    .sort((a, b) => b[1] - a[1]);

  // Generate table rows with position indicators and points behind
  sortedTeams.forEach(([team, points], index) => {
    const position = index + 1;
    let positionIcon = '';
    
    // Position icons
    switch(position) {
      case 1:
        positionIcon = '🏆';
        break;
      case 2:
        positionIcon = '🥈';
        break;
      case 3:
        positionIcon = '🥉';
        break;
      case 4:
        positionIcon = '😬';
        break;
      case 5:
        positionIcon = '👎';
        break;
      case 6:
        positionIcon = '💩';
        break;
    }

    // Calculate points behind
    const pointsBehind = position === 1 ? 0 : sortedTeams[0][1] - points;
    const pointsBehindDisplay = pointsBehind > 0 ? ` (-${pointsBehind})` : '';

    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="standings-cell" style="font-weight: bold;">${position} ${positionIcon}</td>
      <td class="standings-cell" style="font-weight: bold;">${team}</td>
      <td class="standings-cell" style="font-weight: bold;">${points}${pointsBehindDisplay}</td>
    `;
    overallTable.appendChild(row);
  });
}

function loadWeeklyStandings() {
  // Get DOM elements
  const preseasonMessage = document.getElementById("preseason-message");
  const weekSelect = document.getElementById("week-select");
  const weeklyTable = document.querySelector("#weekly-standings tbody");
  const weeklyContent = document.getElementById("weekly-content");
  const preseasonTable = document.getElementById("preseason-standings");

  // Validate data exists
  if (!standingsData) {
    console.error("No standings data available");
    return;
  }

  // Guard clauses for required elements
  if (!weeklyTable || !weekSelect) {
    console.error("Required elements not found");
    return;
  }

  // Clear existing content
  weeklyTable.innerHTML = "";

  // Check if we have any race results
  const hasResults = standingsData.weeks && standingsData.weeks.some(week => 
    week.standings && Object.values(week.standings).some(team => team.total > 0)
  );

  if (!hasResults) {
    // Show preseason content
    if (preseasonMessage) preseasonMessage.style.display = "block";
    if (weeklyContent) weeklyContent.style.display = "none";

    // Handle preseason standings
    if (preseasonTable && currentTeams) {
      const tbody = preseasonTable.querySelector("tbody");
      if (!tbody) {
        console.error("Preseason table tbody not found");
        return;
      }

      // Clear existing preseason content
      tbody.innerHTML = "";

      try {
        // Calculate expected points for each team
        const expectedPoints = {};
        Object.entries(currentTeams).forEach(([team, data]) => {
          if (data.drivers) {
            expectedPoints[team] = calculateExpectedTeamPoints(data.drivers);
          }
        });

        // Sort teams by expected points
        const sortedTeams = Object.entries(expectedPoints)
          .sort((a, b) => b[1] - a[1]);
    


        // Generate table rows
        sortedTeams.forEach(([team, points], index) => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td class="standings-cell">${index + 1}</td>
            <td class="standings-cell">${team}</td>
            <td class="standings-cell">${points.toFixed(1)}</td>
          `;
          tbody.appendChild(row);
        });
      } catch (error) {
        console.error("Error generating preseason standings:", error);
      }
    }
    return;
  }

  // Show weekly content
  if (preseasonMessage) preseasonMessage.style.display = "none";
  if (weeklyContent) weeklyContent.style.display = "block";

  // Get selected week
  const selectedWeek = weekSelect.value ? parseInt(weekSelect.value) - 1 : 0;
  const weekData = standingsData.weeks[selectedWeek];

  if (!weekData || !weekData.standings) {
    console.error("No data for selected week");
    return;
  }

  try {
    // Sort teams by points for the selected week
    const sortedTeams = Object.entries(weekData.standings)
      .sort((a, b) => b[1].total - a[1].total);

    // Generate table rows
    sortedTeams.forEach(([team, data], index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="standings-cell">${index + 1}</td>
        <td class="standings-cell">${team}</td>
        <td class="standings-cell">${data.total}</td>
      `;
      weeklyTable.appendChild(row);
    });
  } catch (error) {
    console.error("Error generating weekly standings:", error);
  }
}

function calculateExpectedTeamPoints(teamDrivers) {
  if (!expectedDriverAverages || !teamDrivers) {
    console.error('Missing required data for point calculation');
    return 0;
  }
  return teamDrivers.reduce((total, driver) => 
    total + (expectedDriverAverages[driver] || 15), 0);
}






// Modify the calculateDriverAverages function
function calculateDriverAverages(weekNumber) {
  const averages = {};

  // If before week 6, use expected averages
  if (weekNumber < 6) {
    return expectedDriverAverages;
  }

  // Get the current teams for this week
  const currentTeams = standingsData.teams(weekNumber);

  // After week 5, calculate actual averages
  Object.entries(currentTeams).forEach(([team, data]) => {
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

  // Get the current teams for this week
  const currentTeams = standingsData.teams(weekNumber);

  // Only check individual drivers
  Object.entries(currentTeams).forEach(([team, data]) => {
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
  try {
    const recapContainer = document.getElementById("weekly-recap");
    if (!recapContainer) return;

    const weekSelect = document.getElementById("week-select");
    const selectedWeekNumber = parseInt(weekSelect.value, 10);
    const weekData = standingsData.weeks.find((week) => week.week === selectedWeekNumber);

    if (!weekData) {
      recapContainer.innerHTML = "<p>No data available for this week.</p>";
      return;
    }

    // Championship Movement section
    if (selectedWeekNumber > 1) {
      try {
        const previousStandings = calculateStandingsAfterWeek(selectedWeekNumber - 1);
        const currentStandings = calculateStandingsAfterWeek(selectedWeekNumber);

        const movements = calculatePositionChanges(previousStandings, currentStandings);
        // ... rest of the championship movement code
      } catch (error) {
        console.error("Error calculating standings:", error);
        // Continue with the rest of the recap even if this part fails
      }
    }

  // Get top team for the week
  const topTeam = Object.entries(weekData.standings)
    .sort((a, b) => b[1].total - a[1].total)[0];

  // Check if topTeam is defined
  if (!topTeam) {
    recapContainer.innerHTML = "<p>No top team data available.</p>";
    return;
  }

  // Find high-scoring drivers (over 30 points) or highest scoring driver
  const highScoringDrivers = [];
  Object.entries(topTeam[1].drivers).forEach(([driver, points]) => {
    if (points >= 30 || points === Math.max(...Object.values(topTeam[1].drivers))) {
      highScoringDrivers.push({ driver, points });
    }
  });

  // Sort drivers by points
  highScoringDrivers.sort((a, b) => b.points - a.points);

  let recapText = `<h3>Race Recap: ${weekData.track}</h3>`;

  // Top Team Section with emojis and styling
  const teamImageName = topTeam[0].replace(/[^a-zA-Z0-9]/g, "_");
  recapText += `
    <div class="recap-section top-team" style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
      <h4>🏆 Team of the Week 🎉</h4>
      <div style="display: flex; align-items: center; gap: 20px;">
        <img 
          src="https://raw.githubusercontent.com/nothinbutnet31/NASCAR/main/images/teams/${teamImageName}.png" 
          alt="${topTeam[0]} Logo"
          style="width: 150px; height: auto;"
          onerror="this.src='https://via.placeholder.com/150'; this.onerror=null;"
        />
        <div>
          <p style="font-size: 1.2em; margin-bottom: 10px;">
            <strong>${topTeam[0]}</strong> with ${topTeam[1].total} points! 🌟
          </p>
          <p>Key performers:</p>
          <ul style="list-style: none; padding-left: 0;">
            ${highScoringDrivers.map(d => 
              `<li>🏁 ${d.driver} (${d.points} points)</li>`
            ).join('')}
          </ul>
        </div>
      </div>
    </div>`;

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
   // Helper function to get finishing position
  const getFinishPosition = (points) => {
    // Use the basePoints directly for position lookup
    const basePoints = driverOfTheWeek.basePoints;

    console.log('Driver details:', {
      driver: driverOfTheWeek.driver,
      totalPoints: driverOfTheWeek.racePoints,
      basePoints: basePoints,
      stagePoints: driverOfTheWeek.details.stageWins,
      qualifyingBonus: driverOfTheWeek.details.hadPole,
      fastestLapBonus: driverOfTheWeek.details.hadFastestLap
    });

    const positionsMap = {
      38: "1st",
      34: "2nd",
      33: "3rd",
      32: "4th",
      31: "5th",
      30: "6th",
      29: "7th",
      28: "8th",
      27: "9th",
      26: "10th",
      25: "11th",
      24: "12th",
      23: "13th",
      22: "14th",
      21: "15th",
      20: "16th",
      19: "17th",
      18: "18th",
      17: "19th",
      16: "20th",
      15: "21st",
      14: "22nd",
      13: "23rd",
      12: "24th",
      11: "25th",
      10: "26th",
      9: "27th",
      8: "28th",
      7: "29th",
      6: "30th",
      5: "31st",
      4: "32nd",
      3: "33rd",
      2: "34th",
      1: "35th"
    };

    return positionsMap[basePoints] || 'Unknown position';
  };

  // Check if driverOfTheWeek is defined
  if (!driverOfTheWeek) {
    recapText += `<p>No driver of the week data available.</p>`;
  } else {
    // Build achievements list for Driver of the Week
    let narrative = `${driverOfTheWeek.driver} finished with ${driverOfTheWeek.racePoints} points`;

    // Add stage wins
    if (driverOfTheWeek.details.stageWins > 0) {
      if (driverOfTheWeek.details.stageWins === 1) {
        narrative += ", won Stage 1";
      } else if (driverOfTheWeek.details.stageWins === 2) {
        narrative += ", won both stages";
      }
    }

    // Add pole and fastest lap
    if (driverOfTheWeek.details.hadPole) {
      narrative += ", started from pole";
    }
    if (driverOfTheWeek.details.hadFastestLap) {
      narrative += ", set the fastest lap";
    }

    // Add performance vs average
    const vsExpected = parseFloat(driverOfTheWeek.details.vsExpected);
    if (vsExpected > 0) {
      narrative += `, was ${vsExpected.toFixed(1)} points above average`;
    }

    // Add team contribution
    narrative += `, and contributed ${driverOfTheWeek.details.teamContribution} of team points`;

    recapText += `
      <div class="recap-section">
        <h4>🏆 Driver of the Week</h4>
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 15px;">
          <div id="driver-image-container"></div>
          <div>
            <p><strong>${driverOfTheWeek.driver}</strong> (${driverOfTheWeek.team})</p>
            <p>${narrative}.</p>
            <p style="
              font-family: 'Georgia', sans-serif; 
              color: #000000; 
              font-size: 1.2em; 
              font-weight: bold;
              margin-top: 10px;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
            ">
              Performance Score: ${driverOfTheWeek.totalScore.toFixed(1)}
            </p>
          </div>
        </div>
      </div>
    `;
  }

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

  // Add Over/Under Performers section using expectedDriverAverages
  const performanceDeltas = [];

  Object.entries(weekData.standings).forEach(([team, data]) => {
    Object.entries(data.drivers).forEach(([driver, points]) => {
      if (points > 0) {
        // Use expected averages before week 6, actual averages after
        const expectedPoints = selectedWeekNumber < 6 
          ? expectedDriverAverages[driver] || 15
          : calculateDriverAverages(selectedWeekNumber)[driver] || 15;
        
        const delta = points - expectedPoints;
        performanceDeltas.push({ driver, team, points, delta, expectedPoints });
      }
    });
  });

  // Sort by delta to find over/under performers
  const sortedDeltas = performanceDeltas.sort((a, b) => b.delta - a.delta);
  const overAchiever = sortedDeltas[0];
  const underPerformer = sortedDeltas[sortedDeltas.length - 1];

  if (overAchiever) {
    recapText += `
      <div class="recap-section">
        <h4>📈 Performance vs ${selectedWeekNumber < 6 ? 'Expected' : 'Average'}</h4>`;

    if (overAchiever) {
      recapText += `<p><strong>Over Achiever:</strong> ${overAchiever.driver} (${overAchiever.team})<br>
        Scored ${overAchiever.points} points, ${overAchiever.delta.toFixed(1)} above their ${selectedWeekNumber < 6 ? 'expected' : 'average'} of ${overAchiever.expectedPoints.toFixed(1)}</p>`;
    }

    if (underPerformer) {
      recapText += `<p><strong>Under Performer:</strong> ${underPerformer.driver} (${underPerformer.team})<br>
        Scored ${underPerformer.points} points, ${Math.abs(underPerformer.delta).toFixed(1)} below their ${selectedWeekNumber < 6 ? 'expected' : 'average'} of ${underPerformer.expectedPoints.toFixed(1)}</p>`;
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

  // Add Hot & Cold Streaks section
  const streaks = checkStreaks(selectedWeekNumber);

  if (streaks.hot.length > 0 || streaks.cold.length > 0) {
    recapText += `
      <div class="recap-section streaks" style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h4>🔥 Hot & Cold Streaks ❄️</h4>
        
        ${streaks.hot.length > 0 ? `
          <div class="hot-streaks" style="margin-bottom: 15px;">
            <p style="color: #ff4d4d;"><strong>🔥 ON FIRE!</strong></p>
            ${streaks.hot.map(streak => `
              <div style="margin-left: 20px;">
                ${streak.driver ? 
                  `${streak.driver} (${streak.team})` : 
                  `Team ${streak.team}`
                }
                <br>
                <small style="color: #666;">
                  ${streak.streak} races with 30+ points
                  ${streak.lastScore ? ` - Latest: ${streak.lastScore} points` : ''}
                </small>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${streaks.cold.length > 0 ? `
          <div class="cold-streaks">
            <p style="color: #4d79ff;"><strong>❄️ ICE COLD</strong></p>
            ${streaks.cold.map(streak => `
              <div style="margin-left: 20px;">
                ${streak.driver ? 
                  `${streak.driver} (${streak.team})` : 
                  `Team ${streak.team}`
                }
                <br>
                <small style="color: #666;">
                  ${streak.streak} races under 10 points
                  ${streak.lastScore ? ` - Latest: ${streak.lastScore} points` : ''}
                </small>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  // Update the recap content
  recapContainer.innerHTML = recapText;

  // Add the image after the HTML is updated
  const container = document.getElementById('driver-image-container');
  if (container) {
    const imgElement = document.createElement('img');
    imgElement.style.width = '150px';
    imgElement.style.height = '150px';
    imgElement.style.objectFit = 'cover';
    imgElement.style.objectPosition = '50% 20%';
    imgElement.style.border = '2px solid #ddd';
    imgElement.alt = driverOfTheWeek.driver;

    const driverImageName = driverOfTheWeek.driver
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('_')
      .replace(/\./g, '')
      .replace(/\s*(Jr|Sr|Iii|Ii|Iv)\s*$/i, '');

    fetch(`https://raw.githubusercontent.com/nothinbutnet31/NASCAR/main/images/drivers/${driverImageName}.png`)
      .then(response => response.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        imgElement.src = url;
        container.appendChild(imgElement);
      })
      .catch(() => {
        imgElement.src = 'path/to/default.png';
        container.appendChild(imgElement);
      });
  }

     updateTrackImage();
  } catch (error) {
    console.error("Error generating weekly recap:", error);
    if (recapContainer) {
      recapContainer.innerHTML = "<p>Error generating recap. Please try again.</p>";
    }
  }
}



// Helper function to calculate standings after a specific week
function calculateStandingsAfterWeek(weekNumber) {
  try {
    const totalPoints = {};
    
    // Get teams for this specific week
    const currentTeams = standingsData.teams(weekNumber);

    // Initialize total points for each team
    Object.keys(currentTeams).forEach(team => {
      totalPoints[team] = 0;
    });

    // Calculate points up to the selected week
    standingsData.weeks
      .filter((week, index) => index < weekNumber)
      .forEach(week => {
        Object.entries(week.standings).forEach(([team, data]) => {
          if (data && data.total) {
            totalPoints[team] = (totalPoints[team] || 0) + data.total;
          }
        });
      });

    // Sort teams by points and return the standings
    return Object.entries(totalPoints)
      .sort((a, b) => b[1] - a[1])
      .map(([team, points], position) => ({
        position: position + 1,
        team,
        points
      }));
  } catch (error) {
    console.error("Error calculating standings:", error);
    return []; // Return empty array if there's an error
  }
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
  selectImageContainer.id = "team-selection-container";
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

  // Get the selected track's week number or default to current week
  const selectedTrackIndex = trackSelect ? trackSelect.value : "";
  const weekNumber = selectedTrackIndex !== "" 
    ? parseInt(selectedTrackIndex) + 1 
    : standingsData.weeks.length;

  // Get the correct team roster for this week
  const currentTeams = standingsData.teams(weekNumber);

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
      const newWeekNumber = trackSelect.value !== "" 
        ? parseInt(trackSelect.value) + 1 
        : standingsData.weeks.length;
      updateTeamRoster(selectedTeam, trackSelect.value, newWeekNumber);
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
  updateTeamRoster(selectedTeam, trackSelect ? trackSelect.value : "", weekNumber);
}

function updateTeamRoster(selectedTeam, selectedTrackIndex, weekNumber) {
  const teamRoster = document.querySelector("#team-roster tbody");
  if (!teamRoster) return;

  // Get the correct team roster for this week
  const currentTeams = standingsData.teams(weekNumber);
  
  teamRoster.innerHTML = "";
  const drivers = currentTeams[selectedTeam].drivers;

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
      <td class="standings-cell">${driver}</td>
      <td class="standings-cell">${points}</td>
    `;
    teamRoster.appendChild(row);
  });
}

// Add this CSS if it's not already present
if (!document.getElementById('team-page-styles')) {
  const styles = document.createElement('style');
  styles.id = 'team-page-styles';
  styles.innerHTML = `
    #team-roster {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }

    #team-roster th,
    #team-roster td {
      padding: 10px;
      text-align: center;
      border: 1px solid #ddd;
    }

    #team-roster th {
      background-color: #1976D2;
      color: white;
      font-weight: bold;
    }

    #team-roster tr:nth-child(even) {
      background-color: #f9f9f9;
    }

    #team-roster tr:hover {
      background-color: #f0f0f0;
    }

    .standings-cell {
      text-align: center !important;
      vertical-align: middle !important;
    }

    #team-selection-container {
      margin: 20px 0;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
  `;
  document.head.appendChild(styles);
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
  const weekSelect = document.getElementById("week-select");
  const weekNumber = weekSelect ? parseInt(weekSelect.value) : 1;
  const currentTeams = standingsData.teams(weekNumber);
  const teamSelect = document.getElementById("team-select");
  teamSelect.innerHTML = "";

  Object.keys(currentTeams).forEach((team) => {
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
 // Clear existing options
  weekSelect.innerHTML = "";
 

  // Add week options
  if (standingsData.weeks && standingsData.weeks.length > 0) {
    standingsData.weeks.forEach((week, index) => {
      if (week && week.track && week.track.trim() !== "") {
        const option = document.createElement("option");
        option.value = index + 1;
        option.textContent = `Week ${index + 1} - ${week.track}`;
        weekSelect.appendChild(option);
      }
    });

    // Set to first week by default (DROPDOWN START)
    weekSelect.value = "8";
  }

  // Single event listener for week changes
  weekSelect.addEventListener("change", () => {
    const selectedWeekNumber = parseInt(weekSelect.value, 10);
    const weekData = standingsData.weeks.find((week) => week.week === selectedWeekNumber);

    // Only call loadWeeklyStandings and generateWeeklyRecap if weekData is valid
    if (weekData && weekData.standings) {
      loadWeeklyStandings();
      generateWeeklyRecap();
    } else {
      console.log("No data available for the selected week.");
    }
  });

  // Initial load
  loadWeeklyStandings();
  generateWeeklyRecap();
}

// Add this new function to handle track images
function updateTrackImage() {
  const weekSelect = document.getElementById("week-select");
  const trackImage = document.getElementById("weekly-track-image");

  if (!trackImage || !weekSelect.value) return;

  const selectedWeek = standingsData.weeks.find(week => week.week === parseInt(weekSelect.value, 10));
  if (selectedWeek && selectedWeek.track) {
    // Capitalize first letter of each word in track name
    const trackName = selectedWeek.track
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('_');
    
    console.log('Track name for URL:', trackName); // Debug log
    
    const trackImageUrl = `https://raw.githubusercontent.com/nothinbutnet31/NASCAR/main/images/tracks/${trackName}.png`;
    trackImage.src = trackImageUrl;
    trackImage.alt = `${selectedWeek.track} Track`;
    trackImage.onerror = function() {
      console.log('Failed to load track image:', trackImageUrl); // Debug log
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

// Initialize the Page
function init() {
  if (!isDataLoaded) {
    console.log("Waiting for data to load...");
    setTimeout(init, 100);
    return;
  }

  try {
    populateWeekDropdown();
    loadOverallStandings();
    createLiveNewsTicker();
    openTab('weekly');
  } catch (error) {
    console.error("Error in init:", error);
  }
}

// Add CSS if it doesn't exist
if (!document.getElementById('standings-styles')) {
  const styles = document.createElement('style');
  styles.id = 'standings-styles';
  styles.innerHTML = `
    #weekly-standings th,
    #weekly-standings td {
      text-align: center !important;
      padding: 10px;
      border: 1px solid #ddd;
    }
    
    #weekly-standings th {
      background-color: #1976D2;
      color: white;
      font-weight: bold;
      text-align: center !important;
    }
    
    #weekly-standings tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    
    #weekly-standings tr:hover {
      background-color: #f0f0f0;
    }
    
    .standings-cell {
      text-align: center !important;
      vertical-align: middle !important;
    }
  `;
  document.head.appendChild(styles);
}

// Start when page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, fetching data...");
  fetchDataFromGoogleSheets();
});

window.onload = () => {
  console.log("Window loaded, checking data...");
  if (isDataLoaded) {
    init();
  }
};

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

      // League updates first
      const leagueUpdates = [
        "🏆 Byron's dominance, Hamlin's luck helps Midge edge out Heather for the win!",
        "🔻 Emilia falls back to 3rd in the standings.",
        "🤏 Top 2 in overall standings only seperated by 6 points!",
        "🎯 Next Race: Food City 500 @ Bristol Motor Speedway, April 13,  2025"
        
      ];

      // Create arrays for both types of updates
      const leagueItems = leagueUpdates.map(update => 
        `<span style="color: black; font-weight: bold;">${update}</span>`
      );

      const newsItems = data.items.map(item => 
        `<a href="${item.link}" target="_blank" style="color: black; text-decoration: none; font-weight: bold;">📰 ${item.title}</a>`
      );

      // Combine with league updates first
      const combinedItems = [...leagueItems, ...newsItems];

      ticker.innerHTML = combinedItems.join(' &nbsp;&nbsp;&bull;&nbsp;&nbsp; ') + ' &nbsp;&nbsp;&bull;&nbsp;&nbsp; ';
      tickerContainer.appendChild(ticker);
    }
  } catch (error) {
    console.error('Error fetching NASCAR news:', error);
    const ticker = document.createElement('div');
    ticker.id = 'news-ticker';
    ticker.innerHTML = `
      <span style="color: black; font-weight: bold;">
        Loading NASCAR News and League Updates... Please check back in a moment...
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
