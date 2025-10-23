const express = require('express');
const axios = require('axios');
const app = express();



// the following API calls are redirects to the sofascore api
/**
 * GET /currentSeason
 */
app.get('/currentSeason', async (req, res) => {
  try {
    const response = await axios.get('https://api.sofascore.com/api/v1/unique-tournament/35/seasons');
    res.json(response.data.seasons[0]);
  } catch (err) {
    console.log(err.response?.status)
    res.status(err.response?.status || 500).send(err.response?.data || 'Error');
  }
});


/**
 * GET /season/:seasonID/round/:roundIndex
 * Example /season/77333/round/1
 *
 * Returns events of the given round
*/
app.get('/season/:sID/round/:rID', async (req, res) => {
  const sID = parseInt(req.params.sID);
  const rID = parseInt(req.params.rID);

  try {
    const response = await axios.get(`https://api.sofascore.com/api/v1/unique-tournament/35/season/${sID}/events/round/${rID}`);
    console.log("https://api.sofascore.com/api/v1/unique-tournament/35/season/" + sID +"/events/round/" + rID)
    const events = response.data.events;
    const result = [];

    for (const event of events) {
      result.push({ 
        homeTeam: event.homeTeam.name,
        awayTeam: event.awayTeam.name,
        homeScore: event.homeScore.current,
        awayScore: event.awayScore.current,
        status: event.status,
        winnerCode: event.winnerCode,
        time: event.time,
        id: event.id
     });
    }

    res.json(result);
  } catch (err) {
    res.status(err.response?.status || 500).send(err.response?.data || 'Error');
  }
});


/**
 * GET /playerStatistics/:gameID
 * Example /playerStatistics/14062008
*/

function appendPlayers(oldResult, players) {
    const result = oldResult
    for (const player of players) {
        result.push({ 
            name : player.player.name,
            rating: player.statistics.rating == null ? 0: player.statistics.rating * 10,
            goals: player.statistics.goals == null ? 0: player.statistics.goals,
            goalAssist: player.statistics.goalAssist == null ? 0:  player.statistics.goalAssist
        });

    }
    return result

}
app.get('/playerStatistics/:gameID', async (req, res) => {
  const gID = parseInt(req.params.gameID);

  try {
    const response = await axios.get(`https://www.sofascore.com/api/v1/event/${gID}/lineups`);
    const homePlayers = response.data.home.players;
    const awayPlayers = response.data.away.players;

    const redCards = await axios.get(`https://www.sofascore.com/api/v1/event/${gID}/incidents`);
    const incidents = redCards.data.incidents;
    
    let result = [];
    result = appendPlayers(result, homePlayers)
    result = appendPlayers(result, awayPlayers)

    // append foul data
    for(const incident of incidents) {
        if (incident.playerName != null) {
            if (incident.incidentClass == "red") {
                console.log(incident)
                for (i in result) {
                    if (result[i].name == incident.playerName) {
                        result[i].hasRedCard = true
                    }
                }
            }
            
        }
    }
    
    
    res.json(result);
  } catch (err) {
    res.status(err.response?.status || 500).send(err.response?.data || 'Error');
  }
});




app.listen(3000, () => console.log('Proxy running on http://localhost:3000'));
