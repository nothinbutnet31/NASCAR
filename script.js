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
  const weeklyPoints = standingsData.weeks
    .filter(week => Object.values(week.standings).some(data => data.total > 0))
    .map(week => {
      const points = {};
      Object.entries(week.standings).forEach(([team, data]) => {
        points[team] = (points[team] || 0) + data.total;
        totalPoints[team] = (totalPoints[team] || 0) + data.total;
      });
      return points;
    });

  // Sort teams by final points
  const sortedTeams = Object.entries(totalPoints).sort((a, b) => b[1] - a[1]);

  // Create race cars if they don't exist
  if (!document.querySelector('[id^="car-"]')) {
    const container = createRaceCars();
    const standingsTable = document.querySelector("#overall-standings");
    standingsTable.parentNode.insertBefore(container, standingsTable);
  }

  // Add lap counter and play button container
  const controlsContainer = document.createElement('div');
  controlsContainer.style.cssText = `
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    z-index: 10;
  `;

  const lapCounter = document.createElement('div');
  lapCounter.style.cssText = `
    color: white;
    font-size: 18px;
    font-weight: bold;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    margin-bottom: 10px;
  `;

  const playButton = document.createElement('button');
  playButton.innerHTML = '▶️ Play Race';
  playButton.style.cssText = `
    padding: 5px 15px;
    font-size: 14px;
    cursor: pointer;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    box-shadow: 2px 2px 4px rgba(0,0,0,0.2);
  `;

  controlsContainer.appendChild(lapCounter);
  controlsContainer.appendChild(playButton);
  document.querySelector('#car-Emilia').parentNode.appendChild(controlsContainer);

  let isAnimating = false;
  let weekIndex = 0;

  const animateWeek = () => {
    if (!isAnimating) return;
    
    const completedWeeks = standingsData.weeks.filter(week => 
      Object.values(week.standings).some(data => data.total > 0)
    );
    
    if (weekIndex < completedWeeks.length) {
      const week = completedWeeks[weekIndex];
      
      lapCounter.innerHTML = `
        <div>Lap ${weekIndex + 1}</div>
        <div style="font-size: 14px;">${week.track}</div>
      `;

      let progress = 0;
      const animateLap = () => {
        progress += 0.005;
        
        sortedTeams.forEach(([team], index) => {
          const car = document.getElementById(`car-${team}`);
          if (car) {
            const { x, y, rotation } = calculateCarPosition(progress, index);
            car.style.transform = `translate(${x}%, ${y}%) rotate(${rotation}deg)`;
          }
        });

        if (progress < 1) {
          requestAnimationFrame(animateLap);
        } else {
          if (weekIndex < completedWeeks.length - 1) {
            weekIndex++;
            setTimeout(animateWeek, 1000);
          } else {
            isAnimating = false;
            playButton.innerHTML = '🔄 Replay';
          }
        }
      };
      
      animateLap();
    }
  };

  // Play button click handler
  playButton.addEventListener('click', () => {
    if (isAnimating) {
      isAnimating = false;
      playButton.innerHTML = '▶️ Play Race';
    } else {
      if (weekIndex >= weeklyPoints.length) {
        weekIndex = 0;
        sortedTeams.forEach(([team], index) => {
          const car = document.getElementById(`car-${team}`);
          if (car) {
            const { x, y, rotation } = calculateCarPosition(0, index);
            car.style.transform = `translate(${x}%, ${y}%) rotate(${rotation}deg)`;
          }
        });
      }
      isAnimating = true;
      playButton.innerHTML = '⏸️ Pause';
      animateWeek();
    }
  });

  // Populate standings table
  sortedTeams.forEach(([team, points], index) => {
    const row = document.createElement("tr");
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
  const recapContainer = document.getElementById("weekly-recap");
  if (!recapContainer) return;

  const weekSelect = document.getElementById("week-select");
  const selectedWeekNumber = parseInt(weekSelect.value, 10);
  const weekData = standingsData.weeks.find((week) => week.week === selectedWeekNumber);

  if (!weekData) {
    recapContainer.innerHTML = "<p>No data available for this week.</p>";
    return;
  }

  // Get top team for the week
  const topTeam = Object.entries(weekData.standings)
    .sort((a, b) => b[1].total - a[1].total)[0];
  
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
  console.log('Full Driver of Week data:', driverOfTheWeek);
  
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

  // Build achievements list for Driver of the Week
  let narrative = `${driverOfTheWeek.driver} finished ${getFinishPosition(driverOfTheWeek.racePoints)}`;
  
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

  // Format driver name for image URL - capitalize each word
  const driverImageName = driverOfTheWeek.driver
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('_')
    .replace(/\./g, '')
    .replace(/\s*(Jr|Sr|Iii|Ii|Iv)\s*$/i, '');
  
  // Create image element with fetch
  const imgElement = document.createElement('img');
  imgElement.style.width = '150px';
  imgElement.style.height = '150px';
  imgElement.style.objectFit = 'cover';
  imgElement.style.objectPosition = '50% 20%';
  imgElement.style.border = '2px solid #ddd';
  imgElement.alt = driverOfTheWeek.driver;

  console.log('Trying to fetch image:', `https://raw.githubusercontent.com/nothinbutnet31/NASCAR/main/images/drivers/${driverImageName}.png`);

  fetch(`https://raw.githubusercontent.com/nothinbutnet31/NASCAR/main/images/drivers/${driverImageName}.png`)
    .then(response => response.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      imgElement.src = url;
    })
    .catch(() => {
      imgElement.src = 'path/to/default.png';
    });

  recapText += `
    <div class="recap-section">
      <h4>🏆 Driver of the Week</h4>
      <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 15px;">
        <div id="driver-image-container"></div>
        <div>
          <p><strong>${driverOfTheWeek.driver}</strong> (${driverOfTheWeek.team})</p>
          <p>${narrative}.</p>
          <p style="
            font-family: 'Impact', sans-serif; 
            color: #1a1a1a; 
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
      <h4>📈 Performance vs Expected</h4>`;
    
    if (overAchiever) {
      recapText += `<p><strong>Over Achiever:</strong> ${overAchiever.driver} (${overAchiever.team})<br>
        Scored ${overAchiever.points} points, ${overAchiever.delta.toFixed(1)} above their expected</p>`;
    }
    
    if (underPerformer) {
      recapText += `<p><strong>Under Performer:</strong> ${underPerformer.driver} (${underPerformer.team})<br>
        Scored ${underPerformer.points} points, ${Math.abs(underPerformer.delta).toFixed(1)} below their expected</p>`;
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
  const recapContent = document.getElementById("weekly-recap");
  if (recapContent) {
    recapContent.innerHTML = recapText;
    
    // Add the image after the HTML is updated
    const container = document.getElementById('driver-image-container');
    if (container) {
      container.appendChild(imgElement);
    }
    
    updateTrackImage();
  }

  // Create race cars if they don't exist
  if (!document.querySelector('[id^="car-"]')) {
    createRaceCars();
  }

  // Initialize cars at starting positions
  const sortedTeams = Object.entries(weekData.standings)
    .sort((a, b) => b[1].total - a[1].total);
    
  sortedTeams.forEach(([team], index) => {
    const car = document.getElementById(`car-${team}`);
    if (car) {
      const { x, y, rotation } = calculateCarPosition(0, index);
      car.style.transform = `translate(${x}%, ${y}%) rotate(${rotation}deg)`;
    }
  });
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

// Add this after your existing code
function createRaceCars() {
  const raceCars = {
    Emilia: { color: 'purple', number: '21' },
    Midge: { color: 'red', number: '11' },
    Dan: { color: 'blue', number: '26' },
    Grace: { color: 'pink', number: '24' },
    Edmund: { color: 'green', number: '31' },
    Heather: { color: 'indigo', number: '14' }
  };

  const container = document.createElement('div');
  container.style.cssText = `
    position: relative;
    width: 100%;
    height: 400px;
    background: #333;
    border-radius: 10px;
    margin: 20px 0;
    overflow: hidden;
  `;

  // Create oval track
  const track = document.createElement('div');
  track.style.cssText = `
    position: absolute;
    width: 80%;
    height: 70%;
    top: 15%;
    left: 10%;
    border: 4px solid white;
    border-radius: 200px;
    box-sizing: border-box;
  `;
  
  // Add start/finish line
  const startLine = document.createElement('div');
  startLine.style.cssText = `
    position: absolute;
    width: 4px;
    height: 40px;
    background: repeating-linear-gradient(
      to bottom,
      white,
      white 4px,
      black 4px,
      black 8px
    );
    top: 50%;
    right: 10%;
    transform: translateY(-50%);
  `;

  container.appendChild(track);
  container.appendChild(startLine);

  Object.entries(raceCars).forEach(([team, details]) => {
    const car = document.createElement('div');
    car.id = `car-${team}`;
    
    // Position cars at starting line, staggered
    car.style.cssText = `
      position: absolute;
      width: 100px;
      height: 40px;
      transition: all 0.5s linear;
      transform-origin: center center;
      right: 12%;
    `;

    // Car HTML structure with styling
    car.innerHTML = `
      <div style="
        position: relative;
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
      ">
        <!-- Car body -->
        <div style="
          position: absolute;
          width: 80px;
          height: 20px;
          background: ${details.color};
          border-radius: 5px;
          bottom: 0;
          left: 10px;
          box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
        "></div>
        
        <!-- Car roof -->
        <div style="
          position: absolute;
          width: 50px;
          height: 15px;
          background: ${details.color};
          border-radius: 5px 5px 0 0;
          bottom: 20px;
          left: 25px;
          box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
        "></div>
        
        <!-- Wheels -->
        <div style="
          position: absolute;
          width: 16px;
          height: 16px;
          background: #333;
          border: 2px solid #666;
          border-radius: 50%;
          bottom: -8px;
          left: 15px;
        "></div>
        <div style="
          position: absolute;
          width: 16px;
          height: 16px;
          background: #333;
          border: 2px solid #666;
          border-radius: 50%;
          bottom: -8px;
          right: 15px;
        "></div>
        
        <!-- Number -->
        <div style="
          position: absolute;
          width: 100%;
          text-align: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
          bottom: 3px;
        ">#${details.number}</div>
        
        <!-- Team name -->
        <div style="
          position: absolute;
          width: 100%;
          text-align: center;
          color: white;
          font-size: 10px;
          bottom: -20px;
        ">${team}</div>
      </div>
    `;
    
    container.appendChild(car);
  });

  return container;
}

// Add this function to calculate car positions around the oval
function calculateCarPosition(progress, lane) {
  const radius = 35; // % of container height
  const centerX = 50; // % of container width
  const centerY = 50; // % of container height
  const trackWidth = 40; // % of container width
  const trackHeight = 35; // % of container height
  
  // Adjust progress to determine position on track
  let x, y, rotation;
  
  if (progress <= 0.25) { // Top straight
    x = centerX + trackWidth * (0.5 - 2 * progress);
    y = centerY - trackHeight;
    rotation = 180;
  } else if (progress <= 0.5) { // Left turn
    const turnProgress = (progress - 0.25) * 4;
    x = centerX - trackWidth/2;
    y = centerY - trackHeight + 2 * trackHeight * turnProgress;
    rotation = 180 + 180 * turnProgress;
  } else if (progress <= 0.75) { // Bottom straight
    x = centerX - trackWidth * (0.5 - 2 * (progress - 0.5));
    y = centerY + trackHeight;
    rotation = 0;
  } else { // Right turn
    const turnProgress = (progress - 0.75) * 4;
    x = centerX + trackWidth/2;
    y = centerY + trackHeight - 2 * trackHeight * turnProgress;
    rotation = 0 + 180 * turnProgress;
  }
  
  // Adjust for different lanes
  const laneOffset = lane * 2; // % offset for each lane
  if (progress <= 0.25 || progress >= 0.75) {
    y += laneOffset;
  } else {
    y -= laneOffset;
  }
  
  return { x, y, rotation };
}

// Update the animation function in loadOverallStandings
function animateWeek() {
  if (!isAnimating) return;
  
  const completedWeeks = standingsData.weeks.filter(week => 
    Object.values(week.standings).some(data => data.total > 0)
  );
  
  if (weekIndex < completedWeeks.length) {
    const week = completedWeeks[weekIndex];
    
    lapCounter.innerHTML = `
      <div>Lap ${weekIndex + 1}</div>
      <div style="font-size: 14px;">${week.track}</div>
    `;

    // Animate cars around the track
    let progress = 0;
    const animateLap = () => {
      progress += 0.005; // Speed of movement
      
      sortedTeams.forEach(([team], index) => {
        const car = document.getElementById(`car-${team}`);
        if (car) {
          const { x, y, rotation } = calculateCarPosition(progress, index);
          car.style.transform = `translate(${x}%, ${y}%) rotate(${rotation}deg)`;
        }
      });

      if (progress < 1) {
        requestAnimationFrame(animateLap);
      } else {
        // Move to final positions for this week
        updateFinalPositions(week);
        if (weekIndex < completedWeeks.length - 1) {
          weekIndex++;
          setTimeout(animateWeek, 1000);
        } else {
          isAnimating = false;
          playButton.innerHTML = '🔄 Replay';
        }
      }
    };
    
    animateLap();
  }
}

// Update car positions based on standings
function updateCarPositions(weekData) {
  if (!weekData || !weekData.standings) return;
  
  const maxPoints = Math.max(...Object.values(weekData.standings).map(data => data.total));
  const containerWidth = document.querySelector('#overall-standings').offsetWidth - 100;
  
  Object.entries(weekData.standings)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([team, data], index) => {
      const car = document.getElementById(`car-${team}`);
      if (car) {
        const verticalPosition = 40 + (index * 60);
        const horizontalPosition = ((data.total / maxPoints) * containerWidth);
        car.style.left = `${horizontalPosition}px`;
        car.style.top = `${verticalPosition}px`;
      }
    });
}
