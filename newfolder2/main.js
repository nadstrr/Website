// Packers team ID in various APIs
const PACKERS_TEAM_ID = 'GB';

// Player data storage
let playersData = [];
let currentSortOrder = 'alphabetical';

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadPlayers();
    setupModalClose();
    setupPlayerSelect();
    setupSortSelect();
});

// Setup player select dropdown
function setupPlayerSelect() {
    const playerSelect = document.getElementById('player-select');
    
    playerSelect.addEventListener('change', (e) => {
        const selectedPlayerId = parseInt(e.target.value);
        if (selectedPlayerId && playersData.length > 0) {
            const selectedPlayer = playersData.find(p => p.id === selectedPlayerId);
            if (selectedPlayer) {
                showPlayerStats(selectedPlayer);
                // Reset dropdown to placeholder
                e.target.value = '';
            }
        }
    });
}

// Setup sort select dropdown
function setupSortSelect() {
    const sortSelect = document.getElementById('sort-select');
    
    sortSelect.addEventListener('change', (e) => {
        currentSortOrder = e.target.value;
        if (playersData.length > 0) {
            displayPlayers(playersData);
        }
    });
}

// Calculate stats score for a player
function calculateStatsScore(player) {
    if (!player.stats) return 0;
    
    let score = 0;
    const stats = player.stats;
    
    // Passing stats
    if (stats.passing) {
        score += (stats.passing.yards || 0) * 0.1;
        score += (stats.passing.touchdowns || 0) * 10;
        score -= (stats.passing.interceptions || 0) * 5;
        if (stats.passing.rating) {
            score += stats.passing.rating * 2;
        }
    }
    
    // Rushing stats
    if (stats.rushing) {
        score += (stats.rushing.yards || 0) * 0.1;
        score += (stats.rushing.touchdowns || 0) * 10;
    }
    
    // Receiving stats
    if (stats.receiving) {
        score += (stats.receiving.yards || 0) * 0.1;
        score += (stats.receiving.receptions || 0) * 2;
        score += (stats.receiving.touchdowns || 0) * 10;
    }
    
    // Defensive stats
    if (stats.defense) {
        score += (stats.defense.tackles || 0) * 2;
        score += (stats.defense.sacks || 0) * 20;
        score += (stats.defense.interceptions || 0) * 15;
        score += (stats.defense.passesDefended || 0) * 5;
        score += (stats.defense.forcedFumbles || 0) * 10;
    }
    
    // Kicking stats
    if (stats.kicking) {
        score += (stats.kicking.fieldGoalsMade || 0) * 5;
        score += (stats.kicking.extraPointsMade || 0) * 1;
        if (stats.kicking.fieldGoalPercentage) {
            score += stats.kicking.fieldGoalPercentage * 2;
        }
    }
    
    // Punting stats
    if (stats.punting) {
        score += (stats.punting.average || 0) * 0.5;
        score += (stats.punting.inside20 || 0) * 3;
    }
    
    // Offensive line stats
    if (stats.offensive) {
        score += (stats.offensive.gamesStarted || 0) * 5;
        score += (stats.offensive.snaps || 0) * 0.1;
    }
    
    return score;
}

// Sort players based on current sort order
function sortPlayers(players) {
    const sorted = [...players];
    
    switch (currentSortOrder) {
        case 'alphabetical':
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'number':
            sorted.sort((a, b) => {
                const numA = a.number || 999;
                const numB = b.number || 999;
                return numA - numB;
            });
            break;
        case 'stats':
            sorted.sort((a, b) => {
                const scoreA = calculateStatsScore(a);
                const scoreB = calculateStatsScore(b);
                return scoreB - scoreA; // Descending order (best first)
            });
            break;
    }
    
    return sorted;
}

// Setup modal close functionality
function setupModalClose() {
    const modal = document.getElementById('stats-modal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            modal.classList.remove('show');
        }
    });
}


// Load Packers players
async function loadPlayers() {
    const loading = document.getElementById('loading');
    const playersGrid = document.getElementById('players-grid');
    
    loading.classList.add('show');
    playersGrid.innerHTML = '';
    
    try {
        // Try to fetch from NFL API
        const players = await fetchPackersPlayers();
        playersData = players;
        
        if (players.length === 0) {
            // Fallback to sample data if API fails
            playersData = getSamplePackersPlayers();
        }
        
        displayPlayers(playersData);
    } catch (error) {
        console.error('Error loading players:', error);
        // Use sample data as fallback
        playersData = getSamplePackersPlayers();
        displayPlayers(playersData);
    } finally {
        loading.classList.remove('show');
    }
}

// Fetch Packers players from API
async function fetchPackersPlayers() {
    try {
        // Using a free NFL API endpoint
        // Note: You may need to replace this with a working API endpoint
        const response = await fetch('https://api.sportsdata.io/v3/nfl/teams/GB/roster?key=demo', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.map(player => ({
                id: player.PlayerID,
                name: player.Name,
                position: player.Position,
                number: player.Number,
                photo: player.PhotoUrl || `https://static.www.nfl.com/image/private/f_auto/league/${player.PlayerID}`,
                stats: null // Will be fetched on click
            }));
        }
    } catch (error) {
        console.log('API fetch failed, using sample data');
    }
    
    return [];
}

// Helper function to generate player initials
function getPlayerInitials(name) {
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// Helper function to create a nice placeholder image
function createPlayerPlaceholder(name, number, size = 150) {
    const initials = getPlayerInitials(name);
    const fontSize = Math.floor(size * 0.22);
    const numberSize = Math.floor(size * 0.26);
    const center = size / 2;
    const initY = size * 0.4;
    const numY = size * 0.7;
    const radius = size / 2;
    
    // Create a simple, reliable SVG with Packers colors - using string concatenation to avoid encoding issues
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '">' +
        '<rect width="' + size + '" height="' + size + '" fill="#203731" rx="' + radius + '"/>' +
        '<text x="' + center + '" y="' + initY + '" font-size="' + fontSize + '" font-weight="bold" fill="#FFB612" text-anchor="middle" dominant-baseline="central">' + 
        escapeHtml(initials) + '</text>' +
        '<text x="' + center + '" y="' + numY + '" font-size="' + numberSize + '" font-weight="bold" fill="#FFB612" text-anchor="middle" dominant-baseline="central">#' + number + '</text>' +
        '</svg>';
    
    // Use URL encoding for maximum compatibility
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

// Helper to escape HTML in text
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper function to get high-resolution NFL.com image URL
// Uses multiple size options for best quality
function getNflImageUrl(imageId, isPrivate = false) {
    if (!imageId) return null;
    const base = isPrivate 
        ? 'https://static.www.nfl.com/image/private'
        : 'https://static.www.nfl.com/image/upload';
    // Try t_headshot_desktop_2x first, fallback to t_headshot_desktop for compatibility
    // Remove t_lazy for immediate loading
    return `${base}/t_headshot_desktop_2x/f_auto/league/${imageId}`;
}

// Function to try to fetch image ID from NFL.com roster page
// This is a helper that can be used to extract IDs if we can access the page
async function fetchNflImageId(playerName) {
    try {
        // Try to fetch the roster page and extract image IDs
        // Note: This may be blocked by CORS, but worth trying
        const response = await fetch('https://www.nfl.com/teams/green-bay-packers/roster', {
            mode: 'no-cors' // May not work due to CORS
        });
        // This approach has limitations due to CORS, so we'll rely on manual extraction
        return null;
    } catch (error) {
        return null;
    }
}

// Mapping of player names to NFL.com image IDs from https://www.nfl.com/teams/green-bay-packers/roster
const nflPlayerImageIds = {
    'Zayne Anderson': { id: 'r4j0wtxm67rnmxl6zajl', private: false },
    'Aaron Banks': { id: 'mkhxl0el2fj3i7k4adsl', private: false },
    'Anthony Belton': { id: 'erhseeamoxq7v9ay9bz8', private: false },
    'Quinton Bohanna': { id: 'jfyxrdrkpytiahvsoatj', private: false },
    'Warren Brinson': { id: 'wbsv4uzbd2wytxysgznq', private: false },
    'Chris Brooks': { id: 'nnwloijqopel4em6vfhb', private: false },
    'Karl Brooks': { id: 'qfyjyfmkoutz6s3ffy12', private: false },
    'Javon Bullard': { id: 'vag7xsajiqpambybsapn', private: false },
    'Edgerrin Cooper': { id: 'huidssokjxzmjjeyb80d', private: false },
    'Brenton Cox Jr.': { id: 'gip2rjldcyryxybsioer', private: false },
    'Brenton Cox Jr': { id: 'gip2rjldcyryxybsioer', private: false },
    'Drake Dabney': { id: 'zhbm42fl9vheduggznpa', private: false },
    'Romeo Doubs': { id: 'ov2llp1bfetznmngqybi', private: false },
    'Kingsley Enagbare': { id: 'ty3h4h6l190fjiwmczlt', private: false },
    'Rashan Gary': { id: 't4clz4xe8sfxszmvohfo', private: true },
    // Image IDs extracted from https://www.nfl.com/teams/green-bay-packers/roster
    'Jordan Love': { id: 'gkbhlytvkltv5whjo3ru', private: false },
    'Josh Jacobs': { id: 'drtobqw2mk7yw3edjgwo', private: false },
    'Jayden Reed': { id: 'qkl36vd0ozvjal6lisw9', private: false },
    'Bo Melton': { id: 'djkllxmjl8nexngwzoe8', private: false },
    'Matthew Golden': { id: 'j3ty1m9rac4bqcysjwqp', private: false },
    'Luke Musgrave': { id: 'nvzq4bmb8b5cwzqpxlp3', private: false },
    'Jacob Monk': { id: 'wrahpqtdvxipwmrepiyl', private: false },
    'Jordan Morgan': { id: 'kfscpyshsfu3hswm7lkd', private: false },
    'Sean Rhyan': { id: 'vxt0byaznbu2o42n2ft7', private: false },
    'Darian Kinnard': { id: 'yr6nj1zqaqg6nbdnxu3q', private: false },
    'Donovan Jennings': { id: 'zb5y9bkkhojda6ljs8sn', private: false },
    'Arron Mosby': { id: 'erqld7keza48co6umuaa', private: false },
    'Barryn Sorrell': { id: 'wytykm0xlylytd0mjuhv', private: false },
    'Nazir Stackhouse': { id: 'xvsnviejqwulftgrccpb', private: false },
    'Jordon Riley': { id: 'km9fm82gypzf94hhrajh', private: false },
    'Isaiah McDuffie': { id: 'vvjc67dqz3mjghgkdr8v', private: false },
    'Ty\'Ron Hopper': { id: 'tqngf0urgkjrrqtx0kzl', private: false },
    'TyRon Hopper': { id: 'tqngf0urgkjrrqtx0kzl', private: false },
    'Collin Oliver': { id: 'kfuljmbcfkwx1quqoklv', private: false },
    'Keisean Nixon': { id: 'vxt0byaznbu2o42n2ft7', private: false }, // Note: Same ID as Sean Rhyan, may need verification
    'Nate Hobbs': { id: 'taqdlsfufqh99ucbl5zm', private: false },
    'Kamal Hadden': { id: 'mswmia17pkencx01nswj', private: false },
    'Xavier McKinney': { id: 'qvwi9b1vfkn0wlmdl7ej', private: false },
    'Kitan Oladapo': { id: 'oi1m7dfixmjcyq8jaj2f', private: false },
    'Brandon McManus': { id: 'yt6xe5fxszt0byq1uszm', private: false },
    'Matthew Orzech': { id: 'j3ty1m9rac4bqcysjwqp', private: false }, // Note: Same ID as Matthew Golden, may need verification
    'Zach Tom': { id: 'ed0itvu56lxrfabusaux', private: false },
    'Clayton Tune': { id: 'qf8khbyllgjzfyqd3yuz', private: false },
    'Carrington Valentine': { id: 'wtkzctyceullg5napiwx', private: false },
    'Lukas Van Ness': { id: 'qxrs2r7nvy9k6hlkqvyb', private: false },
    'Quay Walker': { id: 'dkqnq4ccxwrr7u34aqrz', private: false },
    'Rasheed Walker': { id: 'txizso7r4uhuocg4uhks', private: false },
    'Christian Watson': { id: 'syljognztlbghfeqyqn1', private: false },
    'Daniel Whelan': { id: 'lqnpsqdo5gpoxxirr9b6', private: false },
    'Josh Whyle': { id: 'anwoxedspnle4xdk0cnl', private: false },
    'Dontayvion Wicks': { id: 'er7pbyq82nsbw1w3wyor', private: false },
    'Evan Williams': { id: 'phwdofvsdjhqecxyx1kb', private: false },
    'Savion Williams': { id: 'fkhkv59ojmqixfxkzmno', private: false },
    'Malik Willis': { id: 'hsnetccy7bquili3gcqq', private: false },
    'Emanuel Wilson': { id: 'xni9gnwmhdex7h1ey3jq', private: false },
    'Colby Wooden': { id: 'fwupcm9mwqoufrt6sz2z', private: false }
};

// Helper function to generate ESPN-style player name for URL
function getEspnPlayerName(playerName) {
    // Convert "Jordan Love" to "jordan-love" format
    let name = playerName.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/'/g, '')
        .replace(/\./g, '')
        .replace(/jr\.?/gi, 'jr')
        .replace(/iii/gi, '3')
        .replace(/ii/gi, '2');
    
    // Handle special cases
    const specialCases = {
        'ty\'ron-hopper': 'tyron-hopper',
        'brenton-cox-jr': 'brenton-cox',
        'de\'vondre-campbell': 'devondre-campbell'
    };
    
    return specialCases[name] || name;
}

// Helper function to get ESPN player image URL (tries multiple formats)
function getEspnImageUrl(playerName) {
    const espnName = getEspnPlayerName(playerName);
    // Try the standard format
    return `https://a.espncdn.com/i/headshots/nfl/players/full/${espnName}.png`;
}

// Helper function to get alternative image sources
function getAlternativeImageUrls(playerName, number) {
    const baseName = getEspnPlayerName(playerName);
    return [
        // ESPN standard
        `https://a.espncdn.com/i/headshots/nfl/players/full/${baseName}.png`,
        // ESPN with different casing
        `https://a.espncdn.com/i/headshots/nfl/players/full/${baseName.replace(/-/g, '')}.png`,
        // Try with number
        number ? `https://static.www.nfl.com/image/upload/t_headshot_desktop_2x/f_auto/league/${number}` : null
    ].filter(url => url !== null);
}

// Helper function to get Pro Football Reference image URL pattern
function getPfrImageUrl(playerName) {
    // PFR uses a different naming convention
    const pfrName = playerName.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/'/g, '')
        .replace(/\./g, '')
        .replace(/jr\.?/gi, '');
    return `https://www.pro-football-reference.com/req/202106000/images/headshots/${pfrName}.jpg`;
}

// Helper function to try multiple image sources
async function tryImageUrl(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
        // Timeout after 2 seconds
        setTimeout(() => resolve(false), 2000);
    });
}

// Helper function to try NFL.com image with player name pattern
function tryNflNamePattern(playerName) {
    // NFL.com sometimes uses name-based patterns
    const namePattern = playerName.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/'/g, '')
        .replace(/\./g, '')
        .replace(/jr\.?/gi, 'jr');
    return `https://static.www.nfl.com/image/upload/t_headshot_desktop_2x/f_auto/league/${namePattern}`;
}

// Helper function to get player image URL - tries multiple sources
function getPlayerImageUrl(playerName, number) {
    // Source 1: Try NFL.com if we have a valid image ID (highest quality)
    if (nflPlayerImageIds[playerName]) {
        const imageData = nflPlayerImageIds[playerName];
        // Only use NFL.com if we have an actual image ID (not null)
        if (imageData.id && imageData.id !== 'kl0wvqy8y8y8y8y8y8') {
            const nflUrl = getNflImageUrl(imageData.id, imageData.private);
            if (nflUrl) return nflUrl;
        }
    }
    
    // Source 2: Try ESPN format (good coverage for most players)
    // ESPN uses format: firstname-lastname.png
    const espnUrl = getEspnImageUrl(playerName);
    
    // Return ESPN URL - the image element's onerror handler will fallback to placeholder
    return espnUrl;
}

// Function to preload and test image, then set the best available source
async function loadPlayerImage(imgElement, playerName, number) {
    const placeholderUrl = createPlayerPlaceholder(playerName, number || 0);
    
    // Try NFL.com first (if we have a valid ID)
    if (nflPlayerImageIds[playerName]) {
        const imageData = nflPlayerImageIds[playerName];
        // Only try if we have an actual image ID (not null or placeholder)
        if (imageData.id && imageData.id !== 'kl0wvqy8y8y8y8y8y8') {
            const nflUrl = getNflImageUrl(imageData.id, imageData.private);
            if (await testImageUrl(nflUrl)) {
                imgElement.src = nflUrl;
                return;
            }
        }
    }
    
    // Try ESPN (good coverage for most NFL players)
    const espnUrl = getEspnImageUrl(playerName);
    if (await testImageUrl(espnUrl)) {
        imgElement.src = espnUrl;
        return;
    }
    
    // Try NFL.com name pattern as last resort
    const nflPatternUrl = tryNflNamePattern(playerName);
    if (await testImageUrl(nflPatternUrl)) {
        imgElement.src = nflPatternUrl;
        return;
    }
    
    // Fallback to placeholder
    imgElement.src = placeholderUrl;
}

// Test if an image URL is valid
function testImageUrl(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
        // Timeout after 3 seconds
        setTimeout(() => resolve(false), 3000);
    });
}

// 2025 Packers Roster (ACT status players)
function getSamplePackersPlayers() {
    return [
        // Quarterbacks
        {
            id: 1,
            name: 'Jordan Love',
            position: 'QB',
            number: 10,
            photo: getPlayerImageUrl('Jordan Love', 10),
            stats: {
                passing: {
                    completions: 372,
                    attempts: 579,
                    yards: 3381,
                    touchdowns: 23,
                    interceptions: 7,
                    rating: 98.5
                },
                rushing: {
                    attempts: 50,
                    yards: 247,
                    touchdowns: 4
                }
            }
        },
        {
            id: 2,
            name: 'Clayton Tune',
            position: 'QB',
            number: null,
            photo: getPlayerImageUrl('Clayton Tune', 0),
            stats: {
                passing: {
                    completions: 1,
                    attempts: 4,
                    yards: 8,
                    touchdowns: 0,
                    interceptions: 1,
                    rating: 0.0
                },
                rushing: {
                    attempts: 1,
                    yards: 0,
                    touchdowns: 0
                }
            }
        },
        {
            id: 3,
            name: 'Malik Willis',
            position: 'QB',
            number: 2,
            photo: getPlayerImageUrl('Malik Willis', 2),
            stats: {
                passing: {
                    completions: 12,
                    attempts: 14,
                    yards: 134,
                    touchdowns: 2,
                    interceptions: 0,
                    rating: 146.1
                },
                rushing: {
                    attempts: 0,
                    yards: 0,
                    touchdowns: 0
                }
            }
        },
        // Running Backs
        {
            id: 4,
            name: 'Josh Jacobs',
            position: 'RB',
            number: 8,
            photo: getPlayerImageUrl('Josh Jacobs', 8),
            stats: {
                rushing: {
                    attempts: 233,
                    yards: 926,
                    touchdowns: 13,
                    average: 4.0
                },
                receiving: {
                    receptions: 37,
                    yards: 296,
                    touchdowns: 0
                }
            }
        },
        {
            id: 5,
            name: 'Chris Brooks',
            position: 'RB',
            number: 30,
            photo: getPlayerImageUrl('Chris Brooks', 30),
            stats: {
                rushing: {
                    attempts: 15,
                    yards: 62,
                    touchdowns: 0,
                    average: 4.1
                }
            }
        },
        {
            id: 6,
            name: 'Emanuel Wilson',
            position: 'RB',
            number: 23,
            photo: getPlayerImageUrl('Emanuel Wilson', 23),
            stats: {
                rushing: {
                    attempts: 8,
                    yards: 25,
                    touchdowns: 0,
                    average: 3.1
                }
            }
        },
        // Wide Receivers
        {
            id: 7,
            name: 'Jayden Reed',
            position: 'WR',
            number: 11,
            photo: getPlayerImageUrl('Jayden Reed', 11),
            stats: {
                receiving: {
                    receptions: 64,
                    yards: 793,
                    touchdowns: 8,
                    average: 12.4
                },
                rushing: {
                    attempts: 11,
                    yards: 119,
                    touchdowns: 2
                }
            }
        },
        {
            id: 8,
            name: 'Romeo Doubs',
            position: 'WR',
            number: 87,
            photo: getPlayerImageUrl('Romeo Doubs', 87),
            stats: {
                receiving: {
                    receptions: 52,
                    yards: 662,
                    touchdowns: 6,
                    average: 12.7
                }
            }
        },
        {
            id: 9,
            name: 'Christian Watson',
            position: 'WR',
            number: 9,
            photo: getPlayerImageUrl('Christian Watson', 9),
            stats: {
                receiving: {
                    receptions: 28,
                    yards: 667,
                    touchdowns: 5,
                    average: 23.8
                }
            }
        },
        {
            id: 10,
            name: 'Dontayvion Wicks',
            position: 'WR',
            number: 13,
            photo: getPlayerImageUrl('Dontayvion Wicks', 13),
            stats: {
                receiving: {
                    receptions: 39,
                    yards: 581,
                    touchdowns: 4,
                    average: 14.9
                }
            }
        },
        {
            id: 11,
            name: 'Bo Melton',
            position: 'WR',
            number: 16,
            photo: getPlayerImageUrl('Bo Melton', 16),
            stats: {
                receiving: {
                    receptions: 16,
                    yards: 218,
                    touchdowns: 1,
                    average: 13.6
                }
            }
        },
        {
            id: 12,
            name: 'Matthew Golden',
            position: 'WR',
            number: null,
            photo: getPlayerImageUrl('Matthew Golden', 0),
            stats: {
                receiving: {
                    receptions: 28,
                    yards: 353,
                    touchdowns: 0,
                    average: 12.6
                },
                rushing: {
                    attempts: 0,
                    yards: 49,
                    touchdowns: 0
                }
            }
        },
        {
            id: 13,
            name: 'Savion Williams',
            position: 'WR',
            number: 83,
            photo: getPlayerImageUrl('Savion Williams', 83),
            stats: {
                receiving: {
                    receptions: 0,
                    yards: 0,
                    touchdowns: 0,
                    average: 0
                },
                specialTeams: {
                    kickoffReturnYards: 717
                }
            }
        },
        // Tight Ends
        {
            id: 14,
            name: 'Luke Musgrave',
            position: 'TE',
            number: 88,
            photo: getPlayerImageUrl('Luke Musgrave', 88),
            stats: {
                receiving: {
                    receptions: 34,
                    yards: 352,
                    touchdowns: 1,
                    average: 10.4
                }
            }
        },
        {
            id: 15,
            name: 'Josh Whyle',
            position: 'TE',
            number: 81,
            photo: getPlayerImageUrl('Josh Whyle', 81),
            stats: {
                receiving: {
                    receptions: 2,
                    yards: 16,
                    touchdowns: 0,
                    average: 8.0
                }
            }
        },
        {
            id: 16,
            name: 'Drake Dabney',
            position: 'TE',
            number: null,
            photo: getPlayerImageUrl('Drake Dabney', 0),
            stats: {
                receiving: {
                    receptions: 0,
                    yards: 0,
                    touchdowns: 0,
                    average: 0
                }
            }
        },
        // Offensive Line
        {
            id: 17,
            name: 'Zach Tom',
            position: 'G',
            number: 50,
            photo: getPlayerImageUrl('Zach Tom', 50),
            stats: {
                offensive: {
                    gamesStarted: 17,
                    snaps: 1105
                }
            }
        },
        {
            id: 18,
            name: 'Aaron Banks',
            position: 'G',
            number: 65,
            photo: getPlayerImageUrl('Aaron Banks', 65),
            stats: {
                offensive: {
                    gamesStarted: 16,
                    snaps: 1024
                }
            }
        },
        {
            id: 19,
            name: 'Jacob Monk',
            position: 'C',
            number: 62,
            photo: getPlayerImageUrl('Jacob Monk', 62),
            stats: {
                offensive: {
                    gamesStarted: 0,
                    snaps: 45
                }
            }
        },
        {
            id: 20,
            name: 'Jordan Morgan',
            position: 'OT',
            number: 77,
            photo: getPlayerImageUrl('Jordan Morgan', 77),
            stats: {
                offensive: {
                    gamesStarted: 0,
                    snaps: 12
                }
            }
        },
        {
            id: 21,
            name: 'Rasheed Walker',
            position: 'OT',
            number: 63,
            photo: getPlayerImageUrl('Rasheed Walker', 63),
            stats: {
                offensive: {
                    gamesStarted: 17,
                    snaps: 1105
                }
            }
        },
        {
            id: 22,
            name: 'Sean Rhyan',
            position: 'OT',
            number: 75,
            photo: getPlayerImageUrl('Sean Rhyan', 75),
            stats: {
                offensive: {
                    gamesStarted: 0,
                    snaps: 89
                }
            }
        },
        {
            id: 23,
            name: 'Darian Kinnard',
            position: 'OT',
            number: 70,
            photo: getPlayerImageUrl('Darian Kinnard', 70),
            stats: {
                offensive: {
                    gamesStarted: 0,
                    snaps: 0
                }
            }
        },
        {
            id: 24,
            name: 'Donovan Jennings',
            position: 'OT',
            number: 67,
            photo: getPlayerImageUrl('Donovan Jennings', 67),
            stats: {
                offensive: {
                    gamesStarted: 0,
                    snaps: 0
                }
            }
        },
        {
            id: 25,
            name: 'Anthony Belton',
            position: 'OT',
            number: 71,
            photo: getPlayerImageUrl('Anthony Belton', 71),
            stats: {
                offensive: {
                    gamesStarted: 0,
                    snaps: 0
                }
            }
        },
        // Defensive Line
        {
            id: 26,
            name: 'Rashan Gary',
            position: 'DE',
            number: 52,
            photo: getPlayerImageUrl('Rashan Gary', 52),
            stats: {
                defense: {
                    tackles: 45,
                    sacks: 8.5,
                    tacklesForLoss: 12,
                    qbHits: 22,
                    forcedFumbles: 2
                }
            }
        },
        {
            id: 27,
            name: 'Lukas Van Ness',
            position: 'DE',
            number: 90,
            photo: getPlayerImageUrl('Lukas Van Ness', 90),
            stats: {
                defense: {
                    tackles: 32,
                    sacks: 4.0,
                    tacklesForLoss: 6,
                    qbHits: 12
                }
            }
        },
        {
            id: 28,
            name: 'Kingsley Enagbare',
            position: 'DE',
            number: 55,
            photo: getPlayerImageUrl('Kingsley Enagbare', 55),
            stats: {
                defense: {
                    tackles: 28,
                    sacks: 2.0,
                    tacklesForLoss: 4,
                    qbHits: 8
                }
            }
        },
        {
            id: 29,
            name: 'Brenton Cox Jr.',
            position: 'DE',
            number: 57,
            photo: getPlayerImageUrl('Brenton Cox Jr', 57),
            stats: {
                defense: {
                    tackles: 8,
                    sacks: 0,
                    tacklesForLoss: 1,
                    qbHits: 2
                }
            }
        },
        {
            id: 30,
            name: 'Arron Mosby',
            position: 'DE',
            number: 53,
            photo: getPlayerImageUrl('Arron Mosby', 53),
            stats: {
                defense: {
                    tackles: 3,
                    sacks: 0,
                    tacklesForLoss: 0,
                    qbHits: 0
                }
            }
        },
        {
            id: 31,
            name: 'Barryn Sorrell',
            position: 'DE',
            number: 99,
            photo: getPlayerImageUrl('Barryn Sorrell', 99),
            stats: {
                defense: {
                    tackles: 0,
                    sacks: 0,
                    tacklesForLoss: 0,
                    qbHits: 0,
                    interceptions: 0,
                    passesDefended: 0,
                    forcedFumbles: 0
                }
            }
        },
        {
            id: 32,
            name: 'Colby Wooden',
            position: 'DE',
            number: 96,
            photo: getPlayerImageUrl('Colby Wooden', 96),
            stats: {
                defense: {
                    tackles: 12,
                    sacks: 0.5,
                    tacklesForLoss: 1,
                    qbHits: 3
                }
            }
        },
        {
            id: 33,
            name: 'Karl Brooks',
            position: 'DT',
            number: 94,
            photo: getPlayerImageUrl('Karl Brooks', 94),
            stats: {
                defense: {
                    tackles: 23,
                    sacks: 4.0,
                    tacklesForLoss: 5,
                    qbHits: 9
                }
            }
        },
        {
            id: 34,
            name: 'Warren Brinson',
            position: 'DT',
            number: 91,
            photo: getPlayerImageUrl('Warren Brinson', 91),
            stats: {
                defense: {
                    tackles: 0,
                    sacks: 0,
                    tacklesForLoss: 0,
                    qbHits: 0,
                    interceptions: 0,
                    passesDefended: 0,
                    forcedFumbles: 0
                }
            }
        },
        {
            id: 35,
            name: 'Nazir Stackhouse',
            position: 'DT',
            number: 93,
            photo: getPlayerImageUrl('Nazir Stackhouse', 93),
            stats: {
                defense: {
                    tackles: 0,
                    sacks: 0,
                    tacklesForLoss: 0,
                    qbHits: 0,
                    interceptions: 0,
                    passesDefended: 0,
                    forcedFumbles: 0
                }
            }
        },
        {
            id: 36,
            name: 'Quinton Bohanna',
            position: 'DT',
            number: null,
            photo: getPlayerImageUrl('Quinton Bohanna', 0),
            stats: {
                defense: {
                    tackles: 0,
                    sacks: 0,
                    tacklesForLoss: 0,
                    qbHits: 0,
                    interceptions: 0,
                    passesDefended: 0,
                    forcedFumbles: 0
                }
            }
        },
        {
            id: 37,
            name: 'Jordon Riley',
            position: 'DT',
            number: null,
            photo: getPlayerImageUrl('Jordon Riley', 0),
            stats: {
                defense: {
                    tackles: 0,
                    sacks: 0,
                    tacklesForLoss: 0,
                    qbHits: 0,
                    interceptions: 0,
                    passesDefended: 0,
                    forcedFumbles: 0
                }
            }
        },
        // Linebackers
        {
            id: 38,
            name: 'Quay Walker',
            position: 'LB',
            number: 7,
            photo: getPlayerImageUrl('Quay Walker', 7),
            stats: {
                defense: {
                    tackles: 116,
                    sacks: 2.5,
                    tacklesForLoss: 4,
                    qbHits: 5,
                    interceptions: 1,
                    passesDefended: 4
                }
            }
        },
        {
            id: 39,
            name: 'Edgerrin Cooper',
            position: 'LB',
            number: 56,
            photo: getPlayerImageUrl('Edgerrin Cooper', 56),
            stats: {
                defense: {
                    tackles: 79,
                    sacks: 4,
                    tacklesForLoss: 0,
                    qbHits: 0,
                    interceptions: 1,
                    passesDefended: 8,
                    forcedFumbles: 3
                }
            }
        },
        {
            id: 40,
            name: 'Isaiah McDuffie',
            position: 'LB',
            number: 58,
            photo: getPlayerImageUrl('Isaiah McDuffie', 58),
            stats: {
                defense: {
                    tackles: 25,
                    sacks: 0,
                    tacklesForLoss: 1,
                    qbHits: 0,
                    interceptions: 0,
                    passesDefended: 1
                }
            }
        },
        {
            id: 41,
            name: 'Ty\'Ron Hopper',
            position: 'LB',
            number: 59,
            photo: getPlayerImageUrl('TyRon Hopper', 59),
            stats: {
                defense: {
                    tackles: 0,
                    sacks: 0,
                    tacklesForLoss: 0,
                    qbHits: 0,
                    interceptions: 0,
                    passesDefended: 0,
                    forcedFumbles: 0
                }
            }
        },
        {
            id: 42,
            name: 'Collin Oliver',
            position: 'LB',
            number: 45,
            photo: getPlayerImageUrl('Collin Oliver', 45),
            stats: {
                defense: {
                    tackles: 0,
                    sacks: 0,
                    tacklesForLoss: 0,
                    qbHits: 0,
                    interceptions: 0,
                    passesDefended: 0,
                    forcedFumbles: 0
                }
            }
        },
        // Cornerbacks
        {
            id: 43,
            name: 'Keisean Nixon',
            position: 'CB',
            number: 25,
            photo: getPlayerImageUrl('Keisean Nixon', 25),
            stats: {
                defense: {
                    tackles: 80,
                    interceptions: 1,
                    passesDefended: 8,
                    forcedFumbles: 1
                }
            }
        },
        {
            id: 44,
            name: 'Nate Hobbs',
            position: 'CB',
            number: 21,
            photo: getPlayerImageUrl('Nate Hobbs', 21),
            stats: {
                defense: {
                    tackles: 86,
                    interceptions: 0,
                    passesDefended: 11,
                    forcedFumbles: 1
                }
            }
        },
        {
            id: 45,
            name: 'Carrington Valentine',
            position: 'CB',
            number: 24,
            photo: getPlayerImageUrl('Carrington Valentine', 24),
            stats: {
                defense: {
                    tackles: 44,
                    interceptions: 0,
                    passesDefended: 9,
                    forcedFumbles: 0
                }
            }
        },
        {
            id: 46,
            name: 'Kamal Hadden',
            position: 'CB',
            number: 36,
            photo: getPlayerImageUrl('Kamal Hadden', 36),
            stats: {
                defense: {
                    tackles: 0,
                    sacks: 0,
                    tacklesForLoss: 0,
                    qbHits: 0,
                    interceptions: 0,
                    passesDefended: 0,
                    forcedFumbles: 0
                }
            }
        },
        // Safeties
        {
            id: 47,
            name: 'Xavier McKinney',
            position: 'SAF',
            number: 29,
            photo: getPlayerImageUrl('Xavier McKinney', 29),
            stats: {
                defense: {
                    tackles: 95,
                    interceptions: 2,
                    passesDefended: 8,
                    forcedFumbles: 1
                }
            }
        },
        {
            id: 48,
            name: 'Javon Bullard',
            position: 'SAF',
            number: 20,
            photo: getPlayerImageUrl('Javon Bullard', 20),
            stats: {
                defense: {
                    tackles: 44,
                    interceptions: 0,
                    passesDefended: 5,
                    forcedFumbles: 0
                }
            }
        },
        {
            id: 49,
            name: 'Kitan Oladapo',
            position: 'SAF',
            number: 27,
            photo: getPlayerImageUrl('Kitan Oladapo', 27),
            stats: {
                defense: {
                    tackles: 12,
                    interceptions: 0,
                    passesDefended: 1,
                    forcedFumbles: 0
                }
            }
        },
        {
            id: 50,
            name: 'Zayne Anderson',
            position: 'SAF',
            number: 39,
            photo: getPlayerImageUrl('Zayne Anderson', 39),
            stats: {
                defense: {
                    tackles: 8,
                    interceptions: 0,
                    passesDefended: 0,
                    forcedFumbles: 0
                }
            }
        },
        {
            id: 51,
            name: 'Evan Williams',
            position: 'SAF',
            number: 33,
            photo: getPlayerImageUrl('Evan Williams', 33),
            stats: {
                defense: {
                    tackles: 28,
                    interceptions: 3,
                    passesDefended: 4,
                    forcedFumbles: 0
                }
            }
        },
        // Special Teams
        {
            id: 52,
            name: 'Brandon McManus',
            position: 'K',
            number: 17,
            photo: getPlayerImageUrl('Brandon McManus', 17),
            stats: {
                kicking: {
                    fieldGoalsMade: 26,
                    fieldGoalsAttempted: 32,
                    fieldGoalPercentage: 81.3,
                    longFieldGoal: 53,
                    extraPointsMade: 41,
                    extraPointsAttempted: 42
                }
            }
        },
        {
            id: 53,
            name: 'Daniel Whelan',
            position: 'P',
            number: 19,
            photo: getPlayerImageUrl('Daniel Whelan', 19),
            stats: {
                punting: {
                    punts: 67,
                    average: 47.2,
                    longPunt: 66,
                    inside20: 25
                }
            }
        },
        {
            id: 54,
            name: 'Matthew Orzech',
            position: 'LS',
            number: 42,
            photo: getPlayerImageUrl('Matthew Orzech', 42),
            stats: {
                specialTeams: {
                    snaps: 142
                }
            }
        }
    ];
}

// Display players in grid
function displayPlayers(players) {
    const playersGrid = document.getElementById('players-grid');
    playersGrid.innerHTML = '';
    
    // Sort players based on current sort order
    const sortedPlayers = sortPlayers(players);
    
    // Populate dropdown with player names (always alphabetical for dropdown)
    const playerSelect = document.getElementById('player-select');
    // Clear existing options except the first one
    playerSelect.innerHTML = '<option value="">Select a player...</option>';
    
    // Add players to dropdown in alphabetical order
    const alphabeticalPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));
    alphabeticalPlayers.forEach(player => {
        const option = document.createElement('option');
        option.value = player.id;
        option.textContent = `${player.name}${player.number ? ' #' + player.number : ''} - ${player.position}`;
        option.dataset.playerId = player.id;
        playerSelect.appendChild(option);
    });
    
    // Display players in grid using sorted order
    sortedPlayers.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        playerCard.addEventListener('click', () => showPlayerStats(player));
        
        // Start with placeholder, then try to upgrade to real image
        const placeholderUrl = createPlayerPlaceholder(player.name, player.number || 0);
        const realImageUrl = getPlayerImageUrl(player.name, player.number || 0);
        
        playerCard.innerHTML = `
            <img src="${realImageUrl}" alt="${player.name}" class="player-photo" 
                 style="display: block; width: 150px; height: 150px;"
                 data-player-name="${player.name}"
                 data-player-number="${player.number || 0}">
            <div class="player-name">${player.name}</div>
            <div class="player-position">${player.position}</div>
            <div class="player-number">${player.number ? '#' + player.number : 'No Number'}</div>
        `;
        
        const imgElement = playerCard.querySelector('.player-photo');
        // Set up error handler to fallback to placeholder
        imgElement.onerror = function() {
            if (this.src !== placeholderUrl) {
                this.src = placeholderUrl;
            }
        };
        
        // Always try to load a better image asynchronously for players without confirmed NFL.com images
        const imageData = nflPlayerImageIds[player.name];
        const hasValidNflImage = imageData && imageData.id && imageData.id !== 'kl0wvqy8y8y8y8y8y8';
        
        if (!hasValidNflImage || realImageUrl.includes('espncdn')) {
            // Try to upgrade to real image (ESPN or other sources)
            loadPlayerImage(imgElement, player.name, player.number || 0).catch(() => {
                // If all sources fail, ensure placeholder is shown
                if (imgElement.src !== placeholderUrl) {
                    imgElement.src = placeholderUrl;
                }
            });
        }
        
        playersGrid.appendChild(playerCard);
    });
}

// Show player stats in modal
async function showPlayerStats(player) {
    const modal = document.getElementById('stats-modal');
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = '<div class="loading">Loading stats...</div>';
    modal.classList.add('show');
    
    // Fetch latest stats if not already loaded
    let stats = player.stats;
    // Try to fetch updated stats if we have partial data or no stats
    if (!stats || (stats.passing && stats.passing.attempts === 0 && stats.passing.yards > 0) || 
       (stats.rushing && stats.rushing.attempts === 0 && stats.rushing.yards > 0)) {
        try {
            stats = await fetchPlayerStats(player.id, player.name);
            if (stats) {
                player.stats = stats;
            } else if (player.stats) {
                // Keep existing stats if API fetch fails
                stats = player.stats;
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            stats = player.stats || null;
        }
    }
    
    // Display stats - create larger placeholder for modal
    const playerNumber = player.number || 0;
    const modalPlaceholder = createPlayerPlaceholder(player.name, playerNumber, 200);
    // Try to get a fresh image URL in case the stored one failed
    const modalImageUrl = getPlayerImageUrl(player.name, playerNumber);
    modalBody.innerHTML = `
        <div class="player-stats-header">
            <img src="${modalImageUrl}" alt="${player.name}" 
                 onerror="this.onerror=null; this.src='${modalPlaceholder}'">
            <h2>${player.name}</h2>
            <div class="player-info">
                ${player.position}${player.number ? ' • #' + player.number : ''}
            </div>
        </div>
        ${stats ? renderStats(stats) : '<div class="no-stats">Stats not available at this time.</div>'}
    `;
}

// Fetch player stats from API or NFL.com
async function fetchPlayerStats(playerId, playerName = null) {
    try {
        // Try SportsData API first
        const response = await fetch(`https://api.sportsdata.io/v3/nfl/stats/json/PlayerGameStatsByPlayerID/2025/${playerId}?key=demo`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const games = await response.json();
            const aggregated = aggregateStats(games);
            if (aggregated) return aggregated;
        }
    } catch (error) {
        console.log('Stats API fetch failed');
    }
    
    // Try to fetch from NFL.com player profile page
    if (playerName) {
        try {
            // Convert player name to URL format (e.g., "Jordan Love" -> "jordan-love")
            const urlName = playerName.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
            const playerUrl = `https://www.nfl.com/players/${urlName}/stats`;
            
            // Note: This would require server-side scraping due to CORS
            // For now, we'll rely on the sample stats that are updated with 2025 data
        } catch (error) {
            console.log('NFL.com player page fetch failed');
        }
    }
    
    return null;
}

// Aggregate stats from multiple games
function aggregateStats(games) {
    if (!games || games.length === 0) return null;
    
    const stats = {
        passing: { completions: 0, attempts: 0, yards: 0, touchdowns: 0, interceptions: 0 },
        rushing: { attempts: 0, yards: 0, touchdowns: 0 },
        receiving: { receptions: 0, yards: 0, touchdowns: 0 },
        defense: { tackles: 0, sacks: 0, interceptions: 0, passesDefended: 0, forcedFumbles: 0 }
    };
    
    games.forEach(game => {
        if (game.PassingAttempts) {
            stats.passing.completions += game.PassingCompletions || 0;
            stats.passing.attempts += game.PassingAttempts || 0;
            stats.passing.yards += game.PassingYards || 0;
            stats.passing.touchdowns += game.PassingTouchdowns || 0;
            stats.passing.interceptions += game.PassingInterceptions || 0;
        }
        
        if (game.RushingAttempts) {
            stats.rushing.attempts += game.RushingAttempts || 0;
            stats.rushing.yards += game.RushingYards || 0;
            stats.rushing.touchdowns += game.RushingTouchdowns || 0;
        }
        
        if (game.Receptions) {
            stats.receiving.receptions += game.Receptions || 0;
            stats.receiving.yards += game.ReceivingYards || 0;
            stats.receiving.touchdowns += game.ReceivingTouchdowns || 0;
        }
        
        if (game.Tackles) {
            stats.defense.tackles += game.Tackles || 0;
            stats.defense.sacks += game.Sacks || 0;
            stats.defense.interceptions += game.Interceptions || 0;
            stats.defense.passesDefended += game.PassesDefended || 0;
            stats.defense.forcedFumbles += game.FumbleRecoveries || 0;
        }
    });
    
    // Calculate passer rating if applicable
    if (stats.passing.attempts > 0) {
        const a = ((stats.passing.completions / stats.passing.attempts) - 0.3) * 5;
        const b = ((stats.passing.yards / stats.passing.attempts) - 3) * 0.25;
        const c = (stats.passing.touchdowns / stats.passing.attempts) * 20;
        const d = 2.375 - ((stats.passing.interceptions / stats.passing.attempts) * 25);
        stats.passing.rating = Math.max(0, Math.min(158.3, ((a + b + c + d) / 6) * 100));
    }
    
    return stats;
}

// Render stats in modal
function renderStats(stats) {
    let html = '';
    
    if (stats.passing && stats.passing.attempts > 0) {
        html += `
            <div class="stats-section">
                <h3>Passing Stats</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">Completions</div>
                        <div class="stat-value">${stats.passing.completions}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Attempts</div>
                        <div class="stat-value">${stats.passing.attempts}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Yards</div>
                        <div class="stat-value">${stats.passing.yards.toLocaleString()}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Touchdowns</div>
                        <div class="stat-value">${stats.passing.touchdowns}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Interceptions</div>
                        <div class="stat-value">${stats.passing.interceptions}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Passer Rating</div>
                        <div class="stat-value">${stats.passing.rating ? stats.passing.rating.toFixed(1) : 'N/A'}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    if (stats.rushing && (stats.rushing.attempts > 0 || stats.rushing.yards > 0 || stats.rushing.touchdowns > 0)) {
        const avg = stats.rushing.attempts > 0 ? (stats.rushing.yards / stats.rushing.attempts).toFixed(1) : '0.0';
        html += `
            <div class="stats-section">
                <h3>Rushing Stats</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">Attempts</div>
                        <div class="stat-value">${stats.rushing.attempts || 0}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Yards</div>
                        <div class="stat-value">${(stats.rushing.yards || 0).toLocaleString()}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Touchdowns</div>
                        <div class="stat-value">${stats.rushing.touchdowns || 0}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Average</div>
                        <div class="stat-value">${avg}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    if (stats.receiving && (stats.receiving.receptions > 0 || stats.receiving.yards > 0 || stats.receiving.touchdowns > 0)) {
        const avg = stats.receiving.receptions > 0 ? (stats.receiving.yards / stats.receiving.receptions).toFixed(1) : '0.0';
        html += `
            <div class="stats-section">
                <h3>Receiving Stats</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">Receptions</div>
                        <div class="stat-value">${stats.receiving.receptions || 0}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Yards</div>
                        <div class="stat-value">${(stats.receiving.yards || 0).toLocaleString()}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Touchdowns</div>
                        <div class="stat-value">${stats.receiving.touchdowns || 0}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Average</div>
                        <div class="stat-value">${avg}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    if (stats.defense) {
        html += `
            <div class="stats-section">
                <h3>Defensive Stats</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">Tackles</div>
                        <div class="stat-value">${stats.defense.tackles || 0}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Sacks</div>
                        <div class="stat-value">${stats.defense.sacks || 0}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Interceptions</div>
                        <div class="stat-value">${stats.defense.interceptions || 0}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Passes Defended</div>
                        <div class="stat-value">${stats.defense.passesDefended || 0}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Forced Fumbles</div>
                        <div class="stat-value">${stats.defense.forcedFumbles || 0}</div>
                    </div>
                    ${stats.defense.tacklesForLoss !== undefined ? `
                    <div class="stat-item">
                        <div class="stat-label">Tackles for Loss</div>
                        <div class="stat-value">${stats.defense.tacklesForLoss || 0}</div>
                    </div>
                    ` : ''}
                    ${stats.defense.qbHits !== undefined ? `
                    <div class="stat-item">
                        <div class="stat-label">QB Hits</div>
                        <div class="stat-value">${stats.defense.qbHits || 0}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    if (stats.offensive) {
        html += `
            <div class="stats-section">
                <h3>Offensive Line Stats</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">Games Started</div>
                        <div class="stat-value">${stats.offensive.gamesStarted || 0}</div>
                    </div>
                    ${stats.offensive.snaps !== undefined ? `
                    <div class="stat-item">
                        <div class="stat-label">Snaps</div>
                        <div class="stat-value">${(stats.offensive.snaps || 0).toLocaleString()}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    if (stats.kicking) {
        html += `
            <div class="stats-section">
                <h3>Kicking Stats</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">Field Goals Made</div>
                        <div class="stat-value">${stats.kicking.fieldGoalsMade || 0}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Field Goals Attempted</div>
                        <div class="stat-value">${stats.kicking.fieldGoalsAttempted || 0}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Field Goal %</div>
                        <div class="stat-value">${stats.kicking.fieldGoalPercentage ? stats.kicking.fieldGoalPercentage.toFixed(1) + '%' : 'N/A'}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Long Field Goal</div>
                        <div class="stat-value">${stats.kicking.longFieldGoal || 0} yds</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Extra Points Made</div>
                        <div class="stat-value">${stats.kicking.extraPointsMade || 0}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Extra Points Attempted</div>
                        <div class="stat-value">${stats.kicking.extraPointsAttempted || 0}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    if (stats.punting) {
        html += `
            <div class="stats-section">
                <h3>Punting Stats</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">Punts</div>
                        <div class="stat-value">${stats.punting.punts || 0}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Average</div>
                        <div class="stat-value">${stats.punting.average ? stats.punting.average.toFixed(1) + ' yds' : 'N/A'}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Long Punt</div>
                        <div class="stat-value">${stats.punting.longPunt || 0} yds</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Inside 20</div>
                        <div class="stat-value">${stats.punting.inside20 || 0}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    if (stats.specialTeams) {
        html += `
            <div class="stats-section">
                <h3>Special Teams Stats</h3>
                <div class="stats-grid">
                    ${stats.specialTeams.snaps ? `
                    <div class="stat-item">
                        <div class="stat-label">Snaps</div>
                        <div class="stat-value">${stats.specialTeams.snaps.toLocaleString()}</div>
                    </div>
                    ` : ''}
                    ${stats.specialTeams.kickoffReturnYards !== undefined ? `
                    <div class="stat-item">
                        <div class="stat-label">Kickoff Return Yards</div>
                        <div class="stat-value">${stats.specialTeams.kickoffReturnYards.toLocaleString()}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    if (!html) {
        return '<div class="no-stats">No stats available for this player.</div>';
    }
    
    return html;
}

