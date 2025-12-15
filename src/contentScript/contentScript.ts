chrome.runtime.sendMessage({ action: 'urlchanged' });

//styling finishes here

// Function to create picture-in-picture icon SVG
function createPipIcon(): SVGSVGElement {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", "pip-icon");
  icon.setAttribute("width", "14");
  icon.setAttribute("height", "14");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "2");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.style.display = "inline-block";
  icon.style.verticalAlign = "middle";
  icon.style.opacity = "0.8";
  
  // Create the picture-in-picture icon paths (two overlapping rectangles)
  const rect1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect1.setAttribute("x", "2");
  rect1.setAttribute("y", "6");
  rect1.setAttribute("width", "14");
  rect1.setAttribute("height", "12");
  rect1.setAttribute("rx", "2");
  
  const rect2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect2.setAttribute("x", "10");
  rect2.setAttribute("y", "2");
  rect2.setAttribute("width", "12");
  rect2.setAttribute("height", "10");
  rect2.setAttribute("rx", "2");
  
  icon.appendChild(rect1);
  icon.appendChild(rect2);
  
  return icon;
}

// Function to escape HTML to prevent XSS
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Function to extract match data from current page DOM
function extractMatchDataFromDOM(): any {
  const doc = document;
  
  // Extract match title
  const titleElement = doc.querySelector('h1') || doc.querySelector('title');
  const matchTitle = titleElement?.textContent?.trim() || 'Match Details';
  
  // Extract team scores from the miniscore-branding-container
  let team1Name = '';
  let team1Score = '';
  let team2Name = '';
  let team2Score = '';
  let matchStatus = '';
  let crr = '';
  let req = '';
  
  // Check for finished match first (sticky-mcomplete)
  const finishedMatchContainer = doc.querySelector('#sticky-mcomplete');
  
  // Check for live match container
  const miniscoreContainer = doc.querySelector('#miniscore-branding-container');
  
  // Check if match hasn't started yet - only if there's no live match data
  // Look for countdown or "Match starts at" text, but only if no live scores are present
  const bodyText = doc.body.textContent || '';
  const hasLiveScores = miniscoreContainer && (
    miniscoreContainer.querySelector('.flex.flex-row.font-bold.text-xl') !== null ||
    miniscoreContainer.querySelector('.text-cbTxtLive') !== null
  );
  
  const hasCountdown = !finishedMatchContainer && !hasLiveScores && (
                       bodyText.includes('Match starts at') || 
                       doc.querySelector('[class*="countdown"]') !== null ||
                       (bodyText.match(/Match\s+starts\s+at/i) !== null && 
                        !miniscoreContainer?.textContent?.match(/\d+\s*runs?/i))
                     );
  
  if (hasCountdown) {
    // Extract team names from h1 element (format: "Team1 vs Team2")
    const h1Element = doc.querySelector('h1');
    if (h1Element) {
      // Clone the h1 to avoid modifying the original
      const h1Clone = h1Element.cloneNode(true) as HTMLElement;
      // Remove all span elements to get clean text
      const spans = h1Clone.querySelectorAll('span');
      spans.forEach(span => span.remove());
      // Get text content without spans
      let h1Text = h1Clone.textContent || '';
      
      // Try to find "vs" with different spacing
      let vsIndex = h1Text.toLowerCase().indexOf(' vs ');
      if (vsIndex <= 0) {
        vsIndex = h1Text.toLowerCase().indexOf(' vs');
      }
      if (vsIndex <= 0) {
        vsIndex = h1Text.toLowerCase().indexOf('vs ');
      }
      
      if (vsIndex > 0) {
        // Extract first team (everything before "vs")
        team1Name = h1Text.substring(0, vsIndex).trim();
        // Find where "vs" ends
        let vsEndIndex = vsIndex;
        if (h1Text.substring(vsIndex, vsIndex + 4).toLowerCase() === ' vs ') {
          vsEndIndex = vsIndex + 4;
        } else if (h1Text.substring(vsIndex, vsIndex + 3).toLowerCase() === ' vs') {
          vsEndIndex = vsIndex + 3;
        } else if (h1Text.substring(vsIndex, vsIndex + 3).toLowerCase() === 'vs ') {
          vsEndIndex = vsIndex + 3;
        }
        
        // Extract second team (everything after "vs" until comma or end)
        const afterVs = h1Text.substring(vsEndIndex).trim();
        const commaIndex = afterVs.indexOf(',');
        if (commaIndex > 0) {
          team2Name = afterVs.substring(0, commaIndex).trim();
        } else {
          // Try to find end of team name (before "Match" or other keywords)
          const matchIndex = afterVs.toLowerCase().indexOf(' match');
          if (matchIndex > 0) {
            team2Name = afterVs.substring(0, matchIndex).trim();
          } else {
            team2Name = afterVs.trim();
          }
        }
      }
    }
    
    // If still no team names, try getting from the first text node of h1 directly
    if ((!team1Name || !team2Name) && h1Element) {
      // Get all child text nodes
      const walker = doc.createTreeWalker(
        h1Element,
        NodeFilter.SHOW_TEXT,
        null
      );
      let textNode;
      let fullText = '';
      while (textNode = walker.nextNode()) {
        const parent = textNode.parentElement;
        if (parent && parent.tagName !== 'SPAN') {
          fullText += textNode.textContent || '';
        }
      }
      if (fullText) {
        const vsIndex = fullText.toLowerCase().indexOf(' vs ');
        if (vsIndex > 0) {
          team1Name = team1Name || fullText.substring(0, vsIndex).trim();
          const afterVs = fullText.substring(vsIndex + 4).trim();
          const commaIndex = afterVs.indexOf(',');
          team2Name = team2Name || (commaIndex > 0 ? afterVs.substring(0, commaIndex).trim() : afterVs.trim());
        }
      }
    }
    
    // Fallback 1: Try to extract from page title if h1 didn't work
    if ((!team1Name || !team2Name) && titleElement) {
      const titleText = titleElement.textContent || '';
      let vsIndex = titleText.toLowerCase().indexOf(' vs ');
      if (vsIndex > 0) {
        team1Name = team1Name || titleText.substring(0, vsIndex).trim();
        const afterVs = titleText.substring(vsIndex + 4).trim();
        const commaIndex = afterVs.indexOf(',');
        if (commaIndex > 0) {
          team2Name = team2Name || afterVs.substring(0, commaIndex).trim();
        } else {
          team2Name = team2Name || afterVs.substring(0, afterVs.indexOf(' -') || afterVs.length).trim();
        }
      }
    }
    
    // Fallback 2: try to extract from squad sections if h1 didn't work
    if (!team1Name || !team2Name) {
      const squadSections = doc.querySelectorAll('b');
      const foundTeams: string[] = [];
      for (const boldEl of Array.from(squadSections)) {
        const boldText = boldEl.textContent?.trim() || '';
        if (boldText.includes('Squad:')) {
          // Get parent element text
          const parentEl = boldEl.parentElement;
          if (parentEl) {
            // Get text before "Squad:"
            const parentText = parentEl.textContent || '';
            const squadIndex = parentText.toLowerCase().indexOf(' squad:');
            if (squadIndex > 0) {
              // Extract team name (everything before "Squad:")
              const teamName = parentText.substring(0, squadIndex).trim();
              // Remove any leading "Squads:" or other text
              const cleanTeamName = teamName.replace(/^Squads:\s*/i, '').trim();
              if (cleanTeamName && cleanTeamName.length > 0 && !foundTeams.includes(cleanTeamName)) {
                foundTeams.push(cleanTeamName);
              }
            }
          }
        }
      }
      // Assign found teams
      if (foundTeams.length >= 2) {
        if (!team1Name) team1Name = foundTeams[0];
        if (!team2Name) team2Name = foundTeams[1];
      } else if (foundTeams.length === 1) {
        if (!team1Name) team1Name = foundTeams[0];
        else if (!team2Name) team2Name = foundTeams[0];
      }
    }
    
    // Extract match start time/status from DOM
    const startTimeElement = doc.querySelector('.text-cbPreview');
    if (startTimeElement) {
      const startTimeText = startTimeElement.textContent?.trim() || '';
      if (startTimeText.includes('Match starts at')) {
        matchStatus = startTimeText;
      } else {
        matchStatus = 'Match not started yet';
      }
    } else {
      // Fallback to text search
      const startTimeMatch = bodyText.match(/Match\s+starts\s+at\s+([^\.]+)/i);
      if (startTimeMatch) {
        matchStatus = `Match starts at ${startTimeMatch[1].trim()}`;
      } else {
        matchStatus = 'Match not started yet';
      }
    }
    
    // For upcoming matches, don't show scores
    team1Score = 'Yet to bat';
    team2Score = 'Yet to bat';
  }
  
  if (finishedMatchContainer) {
    // Extract match result/status
    const resultEl = finishedMatchContainer.querySelector('.text-cbTextLink');
    if (resultEl) {
      matchStatus = resultEl.textContent?.trim() || '';
    }
    
    // Extract team scores from finished match structure
    const scoresContainer = finishedMatchContainer.querySelector('.text-lg.font-bold');
    if (scoresContainer) {
      const teamRows = scoresContainer.querySelectorAll('.flex.flex-row');
      if (teamRows.length >= 2) {
        // First team
        const team1Row = teamRows[0];
        const team1NameEl = team1Row.querySelector('div:first-child');
        const team1ScoreEl = team1Row.querySelector('div:last-child');
        if (team1NameEl && team1ScoreEl) {
          team1Name = team1NameEl.textContent?.trim() || '';
          // Extract score - handle nested spans like "212<span>/5</span><span>(20)</span>"
          const team1ScoreText = team1ScoreEl.textContent?.trim() || '';
          // Format: "212/5(20)" -> "212/5 (20)"
          team1Score = team1ScoreText.replace(/\s+/g, '').replace(/(\d+)\/(\d+)\((\d+)\)/, '$1/$2 ($3)');
          // If format doesn't match, try to extract parts manually
          if (!team1Score.match(/\d+\/\d+\s*\(\d+\)/)) {
            const runsMatch = team1ScoreText.match(/(\d+)/);
            const wicketsMatch = team1ScoreText.match(/\/(\d+)/);
            const oversMatch = team1ScoreText.match(/\((\d+)\)/);
            if (runsMatch && wicketsMatch && oversMatch) {
              team1Score = `${runsMatch[1]}/${wicketsMatch[1]} (${oversMatch[1]})`;
            }
          }
        }
        
        // Second team
        const team2Row = teamRows[1];
        const team2NameEl = team2Row.querySelector('div:first-child');
        const team2ScoreEl = team2Row.querySelector('div:last-child');
        if (team2NameEl && team2ScoreEl) {
          team2Name = team2NameEl.textContent?.trim() || '';
          // Extract score - handle nested spans
          const team2ScoreText = team2ScoreEl.textContent?.trim() || '';
          // Format: "198/8(20)" -> "198/8 (20)"
          team2Score = team2ScoreText.replace(/\s+/g, '').replace(/(\d+)\/(\d+)\((\d+)\)/, '$1/$2 ($3)');
          // If format doesn't match, try to extract parts manually
          if (!team2Score.match(/\d+\/\d+\s*\(\d+\)/)) {
            const runsMatch = team2ScoreText.match(/(\d+)/);
            const wicketsMatch = team2ScoreText.match(/\/(\d+)/);
            const oversMatch = team2ScoreText.match(/\((\d+)\)/);
            if (runsMatch && wicketsMatch && oversMatch) {
              team2Score = `${runsMatch[1]}/${wicketsMatch[1]} (${oversMatch[1]})`;
            }
          }
        }
      }
    }
  }
  
  // Only extract from live match container if we haven't found teams yet and it's not an upcoming match
  if (miniscoreContainer && !team1Name && !team2Name && !hasCountdown && !finishedMatchContainer) {
    // Extract team 1 (first team, usually smaller font)
    const team1Row = miniscoreContainer.querySelector('.flex.flex-row.font-light.text-base.text-gray-600');
    if (team1Row) {
      const team1NameEl = team1Row.querySelector('div:first-child');
      const team1ScoreEl = team1Row.querySelector('div:last-child');
      team1Name = team1NameEl?.textContent?.trim() || '';
      team1Score = team1ScoreEl?.textContent?.trim().replace(/\s+/g, ' ') || '';
    }
    
    // Extract team 2 (second team, usually bold and larger)
    const team2Row = miniscoreContainer.querySelector('.flex.flex-row.font-bold.text-xl');
    if (team2Row) {
      const team2NameEl = team2Row.querySelector('div:first-child');
      const team2ScoreEl = team2Row.querySelector('div:nth-child(2)');
      team2Name = team2NameEl?.textContent?.trim() || '';
      team2Score = team2ScoreEl?.textContent?.trim().replace(/\s+/g, ' ') || '';
      
      // Extract CRR and REQ from team2 row
      const team2Text = team2Row.textContent || '';
      const crrMatch = team2Text.match(/CRR[:\s]*(\d+\.\d+)/i);
      const reqMatch = team2Text.match(/REQ[:\s]*(\d+\.\d+)/i);
      if (crrMatch) crr = `CRR: ${crrMatch[1]}`;
      if (reqMatch) req = `REQ: ${reqMatch[1]}`;
    }
    
    // Extract CRR and REQ from entire miniscore container if not found in team2Row
    if (!crr || !req) {
      const miniscoreText = miniscoreContainer.textContent || '';
      if (!crr) {
        const crrMatch = miniscoreText.match(/CRR[:\s]*(\d+\.\d+)/i);
        if (crrMatch) crr = `CRR: ${crrMatch[1]}`;
      }
      if (!req) {
        const reqMatch = miniscoreText.match(/REQ[:\s]*(\d+\.\d+)/i);
        if (reqMatch) req = `REQ: ${reqMatch[1]}`;
      }
    }
    
    // Extract match status
    const statusEl = miniscoreContainer.querySelector('.text-cbTxtLive');
    if (statusEl) {
      matchStatus = statusEl.textContent?.trim() || '';
    }
  }
  
  // Fallback: try to extract from text patterns if above didn't work
  if (!team1Name || !team2Name) {
    const allText = doc.body.innerText || doc.body.textContent || '';
    const teamScoreRegex = /([A-Z0-9]{2,10})\s+(\d+(?:-\d+)?)\s*\((\d+(?:\.\d+)?)\)/g;
    const scoreMatches = Array.from(allText.matchAll(teamScoreRegex));
    
    if (scoreMatches.length >= 2) {
      if (!team1Name) {
        team1Name = scoreMatches[0][1];
        team1Score = `${scoreMatches[0][2]} (${scoreMatches[0][3]})`;
      }
      if (!team2Name) {
        team2Name = scoreMatches[1][1];
        team2Score = `${scoreMatches[1][2]} (${scoreMatches[1][3]})`;
      }
    }
    
    if (!matchStatus) {
      const statusMatch = allText.match(/(?:need|require).*?(?:\d+.*?runs?.*?\d+.*?balls?|balls?.*?\d+)/i);
      matchStatus = statusMatch ? statusMatch[0] : '';
    }
  }
  
  // Always try to extract CRR and REQ from body text if not found yet
  if (!crr) {
    const allText = doc.body.innerText || doc.body.textContent || '';
    const crrMatch = allText.match(/CRR[:\s]*(\d+\.\d+)/i);
    if (crrMatch) crr = `CRR: ${crrMatch[1]}`;
  }
  
  if (!req) {
    const allText = doc.body.innerText || doc.body.textContent || '';
    const reqMatch = allText.match(/REQ[:\s]*(\d+\.\d+)/i);
    if (reqMatch) req = `REQ: ${reqMatch[1]}`;
  }
  
  // Extract batters from scorecard-bat-grid
  const batters: any[] = [];
  
  // Find all grid sections and identify batter rows
  const allGridSections = doc.querySelectorAll('.scorecard-bat-grid');
  let inBatterSection = false;
  
  allGridSections.forEach((section) => {
    const sectionText = section.textContent || '';
    
    // Check if this is the batter header row
    if (sectionText.includes('Batter') && sectionText.includes('R') && sectionText.includes('B')) {
      inBatterSection = true;
      return;
    }
    
    // Check if we've moved to bowler section
    if (sectionText.includes('Bowler')) {
      inBatterSection = false;
      return;
    }
    
    // If we're in batter section and this row has a profile link, it's a batter row
    if (inBatterSection && section.querySelector('a[href*="/profiles/"]') && batters.length < 2) {
      const divs = Array.from(section.children);
      if (divs.length >= 6) {
        const nameEl = section.querySelector('a[href*="/profiles/"]');
        const name = nameEl?.textContent?.trim().replace(/\s*\*\s*/, '') || '';
        
        // Grid structure: name, R, B, 4s, 6s, SR
        const runs = divs[1]?.textContent?.trim() || '0';
        const balls = divs[2]?.textContent?.trim() || '0';
        const fours = divs[3]?.textContent?.trim() || '0';
        const sixes = divs[4]?.textContent?.trim() || '0';
        const sr = divs[5]?.textContent?.trim() || '0';
        
        if (name && name.length > 0) {
          batters.push({ name, runs, balls, fours, sixes, sr });
        }
      }
    }
  });
  
  // Extract bowlers from scorecard-bat-grid
  const bowlers: any[] = [];
  let inBowlerSection = false;
  
  allGridSections.forEach((section) => {
    const sectionText = section.textContent || '';
    
    // Check if this is the bowler header row
    if (sectionText.includes('Bowler') && sectionText.includes('O') && sectionText.includes('M')) {
      inBowlerSection = true;
      return;
    }
    
    // If we're in bowler section and this row has a profile link, it's a bowler row
    if (inBowlerSection && section.querySelector('a[href*="/profiles/"]') && bowlers.length < 2) {
      const divs = Array.from(section.children);
      if (divs.length >= 6) {
        const nameEl = section.querySelector('a[href*="/profiles/"]');
        const name = nameEl?.textContent?.trim().replace(/\s*\*\s*/, '') || '';
        
        // Grid structure: name, O, M, R, W, ECO
        const overs = divs[1]?.textContent?.trim() || '0';
        const maidens = divs[2]?.textContent?.trim() || '0';
        const runs = divs[3]?.textContent?.trim() || '0';
        const wickets = divs[4]?.textContent?.trim() || '0';
        const economy = divs[5]?.textContent?.trim() || '0';
        
        if (name && name.length > 0) {
          bowlers.push({ name, overs, runs, wickets, economy });
        }
      }
    }
  });
  
  // Extract Recent balls - try multiple selectors
  let recent = '';
  
  // First, try to find the hidden wb:flex div that contains Recent section
  const recentContainer = doc.querySelector('.hidden.wb\\:flex.items-start.justify-between');
  if (recentContainer) {
    // Look for the div with tb:flex class inside
    const recentInnerDiv = recentContainer.querySelector('.tb\\:flex.gap-2');
    if (recentInnerDiv) {
      // Get all paragraph tags
      const paragraphs = recentInnerDiv.querySelectorAll('p');
      if (paragraphs.length >= 2) {
        // The second paragraph contains the actual recent balls
        const recentBallsText = paragraphs[1].textContent?.trim() || '';
        if (recentBallsText) {
          recent = recentBallsText;
        }
      }
      // If that doesn't work, try getting all text and extracting after "Recent :"
      if (!recent) {
        const allText = recentInnerDiv.textContent || '';
        const recentMatch = allText.match(/Recent\s*:?\s*(.+)/i);
        if (recentMatch) {
          recent = recentMatch[1].trim();
        }
      }
    }
  }
  
  // Fallback: try to find in miniscore container
  if (!recent && miniscoreContainer) {
    // Search for the hidden wb:flex div within miniscore container
    const recentInMiniscore = miniscoreContainer.querySelector('.hidden.wb\\:flex');
    if (recentInMiniscore) {
      const recentInnerDiv = recentInMiniscore.querySelector('.tb\\:flex');
      if (recentInnerDiv) {
        const paragraphs = recentInnerDiv.querySelectorAll('p');
        if (paragraphs.length >= 2) {
          const recentBallsText = paragraphs[1].textContent?.trim() || '';
          if (recentBallsText) {
            recent = recentBallsText;
          }
        }
      }
    }
    
    // Also try searching all text in miniscore container
    if (!recent) {
      const miniscoreText = miniscoreContainer.textContent || '';
      const recentMatch = miniscoreText.match(/Recent\s*:?\s*([0-9\sW]+)/i);
      if (recentMatch) {
        recent = recentMatch[1].trim();
      }
    }
  }
  
  // Fallback: search entire body for "Recent :" pattern
  if (!recent) {
    const bodyText = doc.body.textContent || '';
    const recentMatch = bodyText.match(/Recent\s*:?\s*([0-9\sW]+)/i);
    if (recentMatch) {
      recent = recentMatch[1].trim();
    }
  }
  
  // Clean up CRR and REQ format
  const crrValue = crr.replace(/CRR[:\s]*/i, '').trim();
  const reqValue = req.replace(/REQ[:\s]*/i, '').trim();
  
  return {
    matchTitle,
    team1Name: team1Name || 'Team 1',
    team1Score: team1Score || '0',
    team2Name: team2Name || 'Team 2',
    team2Score: team2Score || '0',
    matchStatus: matchStatus || 'Match will start soon',
    batters: batters.length > 0 ? batters : [],
    bowlers: bowlers.length > 0 ? bowlers : [],
    crr: crrValue,
    req: reqValue,
    recent,
    matchUrl: window.location.href,
    isUpcoming: hasCountdown
  };
}

// Function to fetch and parse match page data
async function fetchMatchData(matchUrl: string): Promise<any> {
  // First, try to extract from current page if we're already on the match page
  if (window.location.href === matchUrl || window.location.href.includes(matchUrl.split('/').pop() || '')) {
    return extractMatchDataFromDOM();
  }
  
  // Otherwise, try to fetch the page
  try {
    const response = await fetch(matchUrl);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract match title
    const titleElement = doc.querySelector('h1') || doc.querySelector('title');
    const matchTitle = titleElement?.textContent?.trim() || 'Match Details';
    
    // Extract team scores
    const allText = doc.body.textContent || '';
    const teamScoreRegex = /([A-Z0-9]{2,10})\s+(\d+(?:-\d+)?)\s*\((\d+\.\d+)\)/g;
    const scoreMatches = Array.from(allText.matchAll(teamScoreRegex));
    
    let team1Name = '';
    let team1Score = '';
    let team2Name = '';
    let team2Score = '';
    
    if (scoreMatches.length >= 2) {
      team1Name = scoreMatches[0][1];
      team1Score = `${scoreMatches[0][2]} (${scoreMatches[0][3]})`;
      team2Name = scoreMatches[1][1];
      team2Score = `${scoreMatches[1][2]} (${scoreMatches[1][3]})`;
    }
    
    // Extract status, CRR, REQ
    const statusMatch = allText.match(/(?:need|require).*?(?:\d+.*?runs?.*?\d+.*?balls?|balls?.*?\d+)/i);
    const matchStatus = statusMatch ? statusMatch[0] : '';
    const crrMatch = allText.match(/CRR[:\s]*(\d+\.\d+)/i);
    const reqMatch = allText.match(/REQ[:\s]*(\d+\.\d+)/i);
    const crr = crrMatch ? `CRR: ${crrMatch[1]}` : '';
    const req = reqMatch ? `REQ: ${reqMatch[1]}` : '';
    
    // Extract batters and bowlers (simplified for fetched HTML)
    const batters: any[] = [];
    const bowlers: any[] = [];
    
    return {
      matchTitle,
      team1Name: team1Name || 'Team 1',
      team1Score: team1Score || '0',
      team2Name: team2Name || 'Team 2',
      team2Score: team2Score || '0',
      matchStatus: matchStatus || 'Match in progress',
      batters,
      bowlers,
      crr,
      req,
      matchUrl
    };
  } catch (error) {
    console.error('Error fetching match data:', error);
    // Fallback: try to extract from current page anyway
    return extractMatchDataFromDOM();
  }
}

// Function to handle PiP button click on match page - extract from current page and create PiP
// viewType: 'simple' for score only, 'full' for complete match details
async function createPipFromMatchPage(viewType: 'simple' | 'full' = 'simple'): Promise<void> {
  // Check if documentPictureInPicture API is available
  if (!('documentPictureInPicture' in window)) {
    // Fallback: send to background script
    const matchData = extractMatchDataFromDOM();
    chrome.runtime.sendMessage({
      action: 'createPipPopup',
      matchData
    });
    return;
  }
  
  try {
    // Create PiP window from match page (we have user activation from button click)
    const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
      width: 420,
      height: viewType === 'simple' ? 200 : 500
    });
    
    // Extract data from current match page
    const matchData = extractMatchDataFromDOM();
    
    // Show loading state initially
    const loadingData = {
      matchTitle: 'Loading...',
      team1Name: '',
      team1Score: '',
      team2Name: '',
      team2Score: '',
      matchStatus: 'Extracting match data...',
      batters: [],
      bowlers: [],
      crr: '',
      req: '',
      matchUrl: window.location.href
    };
    
    // Use appropriate render function based on view type
    const renderFunction = viewType === 'simple' ? renderSimplePipContent : renderPipContent;
    renderFunction(pipWindow, loadingData);
    
    // Render actual data
    if (matchData) {
      renderFunction(pipWindow, matchData);
      
      // Set up MutationObserver to watch for DOM changes in the match page
      const miniscoreContainer = document.querySelector('#miniscore-branding-container');
      if (miniscoreContainer) {
        const observer = new MutationObserver(() => {
          // Debounce updates to avoid too frequent refreshes
          clearTimeout((observer as any).updateTimeout);
          (observer as any).updateTimeout = setTimeout(() => {
            const updatedData = extractMatchDataFromDOM();
            if (updatedData) {
              renderFunction(pipWindow, updatedData);
            }
          }, 500); // Wait 500ms after last change before updating
        });
        
        // Observe changes in the miniscore container and its children
        observer.observe(miniscoreContainer, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: false
        });
        
        // Also observe the scorecard sections (only for full view)
        if (viewType === 'full') {
          const scorecardSections = document.querySelectorAll('.scorecard-bat-grid');
          scorecardSections.forEach(section => {
            observer.observe(section, {
              childList: true,
              subtree: true,
              characterData: true
            });
          });
        }
        
        // Clean up observer when window closes
        pipWindow.addEventListener('pagehide', () => {
          observer.disconnect();
        });
      }
    } else {
      renderFunction(pipWindow, {
        ...loadingData,
        matchStatus: 'Failed to extract match data'
      });
    }
  } catch (error) {
    console.error('Error creating PiP window:', error);
  }
}

// Function to render simplified PiP content (only scores, status, CRR/REQ)
function renderSimplePipContent(pipWindow: Window, data: any): void {
    pipWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 420px;
      height: 200px;
      margin: 0;
      padding: 0;
      background-color: #222;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      overflow: hidden;
      color: #fff;
    }
    .header {
      background-color: #2a2a2a;
      padding: 10px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #2a2a2a;
    }
    .title {
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }
    .close-btn {
      background: none;
      border: none;
      color: #fff;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      border-radius: 4px;
      margin-left: 8px;
    }
    .close-btn:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    .content {
      padding: 12px;
    }
    .score-section {
      background-color: #222;
      border-radius: 6px;
      padding: 12px;
    }
    .team-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #2a2a2a;
    }
    .team-row:last-child {
      border-bottom: none;
    }
    .team-name {
      font-size: 14px;
      font-weight: 500;
      color: #b3b3b3;
    }
    .team-row:last-child .team-name {
      color: #fff;
      font-weight: 700;
      font-size: 18px;
    }
    .team-score {
      font-size: 16px;
      font-weight: 600;
      color: #fff;
    }
    .status {
      margin-top: 8px;
      color: #ff0000;
      font-size: 12px;
      font-weight: 500;
    }
    .rates {
      display: flex;
      gap: 16px;
      margin-top: 8px;
      font-size: 11px;
    }
    .rate-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .rate-label {
      font-weight: 600;
      color: #b5b5b5;
    }
    .rate-value {
      color: #b5b5b5;
      font-weight: normal;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${escapeHtml(data.matchTitle || 'Match Details')}</div>
    <button class="close-btn" onclick="window.close()">×</button>
  </div>
  <div class="content">
    ${data.isUpcoming ? `
      <div class="score-section" style="display: flex; align-items: center; justify-content: center; height: 100%; text-align: center;">
        <div style="font-size: 16px; color: #fff; font-weight: 500;">
          Match is about to start
        </div>
      </div>
    ` : `
      <div class="score-section">
        <div class="team-row">
          <span class="team-name">${escapeHtml(data.team1Name || 'Team 1')}</span>
          <span class="team-score">${escapeHtml(data.team1Score || '0')}</span>
        </div>
        <div class="team-row">
          <span class="team-name">${escapeHtml(data.team2Name || 'Team 2')}</span>
          <span class="team-score">${escapeHtml(data.team2Score || '0')}</span>
        </div>
        ${data.matchStatus ? `<div class="status">${escapeHtml(data.matchStatus)}</div>` : ''}
        ${data.crr || data.req ? `
          <div class="rates">
            ${data.crr ? `
              <div class="rate-item">
                <span class="rate-label">CRR:</span>
                <span class="rate-value">${escapeHtml(data.crr)}</span>
              </div>
            ` : ''}
            ${data.req ? `
              <div class="rate-item">
                <span class="rate-label">REQ:</span>
                <span class="rate-value">${escapeHtml(data.req)}</span>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `}
  </div>
</body>
</html>
  `);
  pipWindow.document.close();
}

// Function to render PiP content
function renderPipContent(pipWindow: Window, data: any): void {
  const batterRows = data.batters.map((b: any) => `
    <tr>
      <td class="batter-name">${escapeHtml(b.name || '')}</td>
      <td class="batter-runs">${escapeHtml(b.runs || '0')}</td>
      <td class="batter-balls">${escapeHtml(b.balls || '0')}</td>
      <td class="batter-fours">${escapeHtml(b.fours || '0')}</td>
      <td class="batter-sixes">${escapeHtml(b.sixes || '0')}</td>
      <td class="batter-sr">${escapeHtml(b.sr || '0')}</td>
    </tr>
  `).join('');
  
  const bowlerRows = data.bowlers.map((b: any) => `
    <tr>
      <td class="bowler-name">${escapeHtml(b.name || '')}</td>
      <td class="bowler-overs">${escapeHtml(b.overs || '0')}</td>
      <td class="bowler-runs">${escapeHtml(b.runs || '0')}</td>
      <td class="bowler-wickets">${escapeHtml(b.wickets || '0')}</td>
      <td class="bowler-economy">${escapeHtml(b.economy || '0')}</td>
    </tr>
  `).join('');
  
    pipWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 420px;
      height: 500px;
      margin: 0;
      padding: 0;
      background-color: #222;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      overflow-y: auto;
      color: #fff;
    }
    .header {
      background-color: #2a2a2a;
      padding: 10px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #2a2a2a;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .title {
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }
    .close-btn {
      background: none;
      border: none;
      color: #fff;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      border-radius: 4px;
      margin-left: 8px;
    }
    .close-btn:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    .content {
      padding: 12px;
    }
    .score-section {
      background-color: #222;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 12px;
    }
    .team-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #2a2a2a;
    }
    .team-row:last-child {
      border-bottom: none;
    }
    .team-name {
      font-size: 14px;
      font-weight: 500;
      color: #b3b3b3;
    }
    .team-row:last-child .team-name {
      color: #fff;
      font-weight: 700;
      font-size: 18px;
    }
    .team-score {
      font-size: 16px;
      font-weight: 600;
      color: #fff;
    }
    .recent-section {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #2a2a2a;
      font-size: 11px;
    }
    .recent-label {
      font-weight: 600;
      color: #fff;
      margin-right: 4px;
    }
    .recent-value {
      color: #fff;
    }
    .status {
      margin-top: 8px;
      color: #ff0000;
      font-size: 12px;
      font-weight: 500;
    }
    .rates {
      display: flex;
      gap: 16px;
      margin-top: 8px;
      font-size: 11px;
    }
    .rate-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .rate-label {
      font-weight: 600;
      color: #b5b5b5;
    }
    .rate-value {
      color: #b5b5b5;
      font-weight: normal;
    }
    .section-title {
      font-size: 12px;
      font-weight: 600;
      color: #4fc2a3;
      margin: 16px 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background-color: #4c4c4c;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 12px;
    }
    thead {
      background-color: #2a2a2a;
    }
    th {
      padding: 8px 6px;
      text-align: left;
      font-size: 10px;
      font-weight: 600;
      color: #b5b5b5;
      text-transform: uppercase;
    }
    td {
      padding: 6px;
      font-size: 11px;
      border-bottom: 1px solid #2a2a2a;
      color: #fff;
    }
    tbody tr:last-child td {
      border-bottom: none;
    }
    .batter-name, .bowler-name {
      color: #4a89e7;
      font-weight: 500;
    }
    .batter-runs, .bowler-wickets {
      color: #fff;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${escapeHtml(data.matchTitle || 'Match Details')}</div>
    <button class="close-btn" onclick="window.close()">×</button>
  </div>
  <div class="content">
    ${data.isUpcoming ? `
      <div class="score-section" style="display: flex; align-items: center; justify-content: center; height: 400px; text-align: center;">
        <div style="font-size: 18px; color: #fff; font-weight: 500;">
          Match is about to start
        </div>
      </div>
    ` : `
      <div class="score-section">
      <div class="team-row">
          <span class="team-name">${escapeHtml(data.team1Name || 'Team 1')}</span>
          <span class="team-score">${escapeHtml(data.team1Score || '0')}</span>
      </div>
      <div class="team-row">
          <span class="team-name">${escapeHtml(data.team2Name || 'Team 2')}</span>
          <span class="team-score">${escapeHtml(data.team2Score || '0')}</span>
        </div>
        ${data.recent ? `
          <div class="recent-section">
            <span class="recent-label">Recent:</span>
            <span class="recent-value">${escapeHtml(data.recent)}</span>
          </div>
        ` : ''}
        ${data.matchStatus ? `<div class="status">${escapeHtml(data.matchStatus)}</div>` : ''}
        ${data.crr || data.req ? `
          <div class="rates">
            ${data.crr ? `
              <div class="rate-item">
                <span class="rate-label">CRR:</span>
                <span class="rate-value">${escapeHtml(data.crr)}</span>
              </div>
            ` : ''}
            ${data.req ? `
              <div class="rate-item">
                <span class="rate-label">REQ:</span>
                <span class="rate-value">${escapeHtml(data.req)}</span>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
      
      ${data.batters && data.batters.length > 0 ? `
        <div class="section-title">Batters</div>
        <table>
          <thead>
            <tr>
              <th>Batter</th>
              <th>R</th>
              <th>B</th>
              <th>4s</th>
              <th>6s</th>
              <th>SR</th>
            </tr>
          </thead>
          <tbody>
            ${batterRows}
          </tbody>
        </table>
      ` : ''}
      
      ${data.bowlers && data.bowlers.length > 0 ? `
        <div class="section-title">Bowlers</div>
        <table>
          <thead>
            <tr>
              <th>Bowler</th>
              <th>O</th>
              <th>R</th>
              <th>W</th>
              <th>Eco</th>
            </tr>
          </thead>
          <tbody>
            ${bowlerRows}
          </tbody>
        </table>
      ` : ''}
    `}
  </div>
</body>
</html>
    `);
    pipWindow.document.close();
}

// Function to add PiP button to match page
function addPipButtonToMatchPage() {
  // Check if we're on a match page
  const isMatchPage = window.location.href.includes('/live-cricket-scores/') || 
                      window.location.href.includes('/cricket-scores/');
  
  if (!isMatchPage) return;
  
  // Find the miniscore-branding-container
  const miniscoreContainer = document.querySelector('#miniscore-branding-container');
  if (!miniscoreContainer) return;
  
  // Check if buttons already exist
  if (miniscoreContainer.querySelector('.pip-button')) return;
  
  // Find the desktop view div with "px-4 py-2 justify-between"
  const desktopScoreDiv = miniscoreContainer.querySelector('.px-4.py-2.justify-between');
  
  // Find the mobile view div
  const mobileScoreDiv = miniscoreContainer.querySelector('#sticky-mscore');
  
  let buttonContainer: HTMLElement | null = null;
  
  // Try to add to desktop view first - add next to miniscore_branding
  if (desktopScoreDiv) {
    // Find the miniscore_branding div or the justify-between container
    const justifyDiv = desktopScoreDiv.querySelector('.justify-between');
    if (justifyDiv) {
      // Add button after the score content, before or after miniscore_branding
      const brandingDiv = justifyDiv.querySelector('#miniscore_branding');
      if (brandingDiv && brandingDiv.parentElement) {
        buttonContainer = document.createElement('div');
        buttonContainer.className = 'pip-button-wrapper';
        buttonContainer.style.cssText = 'display: flex; align-items: center; margin-left: 8px;';
        brandingDiv.parentElement.insertBefore(buttonContainer, brandingDiv.nextSibling);
      } else {
        // Add to the end of justify-between div
        buttonContainer = document.createElement('div');
        buttonContainer.className = 'pip-button-wrapper';
        buttonContainer.style.cssText = 'display: flex; align-items: center; margin-left: auto;';
        justifyDiv.appendChild(buttonContainer);
      }
    }
  }
  
  // If desktop not found, try mobile view
  if (!buttonContainer && mobileScoreDiv) {
    const mobileContent = mobileScoreDiv.querySelector('div.flex.flex-row');
    if (mobileContent) {
      // Add button next to miniscore_branding in mobile view
      const brandingDiv = mobileContent.querySelector('#miniscore_branding');
      if (brandingDiv && brandingDiv.parentElement) {
        buttonContainer = document.createElement('div');
        buttonContainer.className = 'pip-button-wrapper';
        buttonContainer.style.cssText = 'display: flex; align-items: center; margin-left: 8px;';
        brandingDiv.parentElement.insertBefore(buttonContainer, brandingDiv.nextSibling);
      } else {
        buttonContainer = document.createElement('div');
        buttonContainer.className = 'pip-button-wrapper';
        buttonContainer.style.cssText = 'display: flex; align-items: center; margin-left: auto; padding: 0 8px;';
        mobileContent.appendChild(buttonContainer);
      }
    }
  }
  
  // Fallback: add to the mx-4 div (the one with TAR, CRR, REQ stats)
  if (!buttonContainer) {
    const statsDiv = miniscoreContainer.querySelector('.mx-4');
    if (statsDiv) {
      const statsContent = statsDiv.querySelector('div.text-md');
      if (statsContent) {
        buttonContainer = document.createElement('div');
        buttonContainer.className = 'pip-button-wrapper';
        buttonContainer.style.cssText = 'display: inline-flex; align-items: center; margin-left: 12px;';
        statsContent.appendChild(buttonContainer);
      }
    }
  }
  
  // Last fallback: add to miniscore container directly
  if (!buttonContainer) {
    buttonContainer = document.createElement('div');
    buttonContainer.className = 'pip-button-wrapper';
    buttonContainer.style.cssText = 'display: flex; align-items: center; padding: 8px 16px; justify-content: flex-end;';
    miniscoreContainer.insertBefore(buttonContainer, miniscoreContainer.firstChild);
  }
  
  // Create button wrapper for both buttons
  buttonContainer.style.cssText += ' gap: 8px;';
  
  // Create "Pin Score" button (simple view)
  const pinScoreButton = document.createElement('button');
  pinScoreButton.className = 'pip-button pip-button-score';
  pinScoreButton.title = 'Pin Score';
  pinScoreButton.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="6" width="14" height="12" rx="2"></rect>
      <rect x="10" y="2" width="12" height="10" rx="2"></rect>
    </svg>
    <span style="margin-left: 4px; font-size: 11px;">Score</span>
  `;
  pinScoreButton.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px 10px;
    background-color: #4fc2a3;
    color: white;
      border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 11px;
    white-space: nowrap;
  `;
  
  pinScoreButton.onmouseenter = () => {
    pinScoreButton.style.backgroundColor = '#3fb893';
  };
  pinScoreButton.onmouseleave = () => {
    pinScoreButton.style.backgroundColor = '#4fc2a3';
  };
  
  pinScoreButton.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    createPipFromMatchPage('simple');
  };
  
  // Create "Pin Match" button (full view)
  const pinMatchButton = document.createElement('button');
  pinMatchButton.className = 'pip-button pip-button-match';
  pinMatchButton.title = 'Pin Match';
  pinMatchButton.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="6" width="14" height="12" rx="2"></rect>
      <rect x="10" y="2" width="12" height="10" rx="2"></rect>
    </svg>
    <span style="margin-left: 4px; font-size: 11px;">Match</span>
  `;
  pinMatchButton.style.cssText = `
      display: inline-flex;
      align-items: center;
    justify-content: center;
    padding: 6px 10px;
    background-color: #4a89e7;
    color: white;
    border: none;
    border-radius: 4px;
      cursor: pointer;
    transition: background-color 0.2s;
    font-size: 11px;
    white-space: nowrap;
  `;
  
  pinMatchButton.onmouseenter = () => {
    pinMatchButton.style.backgroundColor = '#3a79d7';
  };
  pinMatchButton.onmouseleave = () => {
    pinMatchButton.style.backgroundColor = '#4a89e7';
  };
  
  pinMatchButton.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
    createPipFromMatchPage('full');
  };
  
  buttonContainer.appendChild(pinScoreButton);
  buttonContainer.appendChild(pinMatchButton);
}

// Function to observe DOM changes and add PiP button when match page loads
function observeAndAddPipButton() {
  // Try to add button immediately
  addPipButtonToMatchPage();
  
  // Observe for DOM changes (for dynamic content)
  const observer = new MutationObserver(() => {
    addPipButtonToMatchPage();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}


// Add PiP button to match pages
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    observeAndAddPipButton();
  });
} else {
  observeAndAddPipButton();
}
