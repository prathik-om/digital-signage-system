const catalyst = require('zcatalyst-sdk-node');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    try {
        const app = catalyst.initialize(req);
        
        // Parse request body
        let body = {};
        if (req.body) {
            body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        }

        const action = body.action || req.query.action;

        switch (action) {
            case 'fetchChannelMessages':
                await fetchChannelMessages(app, body, res);
                break;
            case 'fetchAllChannels':
                await fetchAllChannels(app, body, res);
                break;
            case 'processHistoricalMessages':
                await processHistoricalMessages(app, body, res);
                break;
            default:
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    status: 'error', 
                    message: 'Invalid action. Use: fetchChannelMessages, fetchAllChannels, or processHistoricalMessages' 
                }));
        }
    } catch (error) {
        console.error('Error in cliq-message-fetcher:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'error', 
            message: error.message 
        }));
    }
};

async function fetchChannelMessages(app, body, res) {
    try {
        const { channelId, limit = 50, before = null } = body;
        
        if (!channelId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                status: 'error', 
                message: 'channelId is required' 
            }));
            return;
        }

        // Build API URL for fetching messages
        let url = `https://cliq.zoho.com/api/v2/channels/${channelId}/messages?limit=${limit}`;
        if (before) {
            url += `&before=${before}`;
        }

        // Make API call to Zoho Cliq
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.ZOHO_CLIQ_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Cliq API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'success',
            data: data,
            message: `Fetched ${data.messages?.length || 0} messages from channel`
        }));

    } catch (error) {
        console.error('Error fetching channel messages:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'error', 
            message: error.message 
        }));
    }
}

async function fetchAllChannels(app, body, res) {
    try {
        // Fetch all channels the bot has access to
        const response = await fetch('https://cliq.zoho.com/api/v2/channels', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.ZOHO_CLIQ_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Cliq API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'success',
            data: data,
            message: `Fetched ${data.channels?.length || 0} channels`
        }));

    } catch (error) {
        console.error('Error fetching channels:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'error', 
            message: error.message 
        }));
    }
}

async function processHistoricalMessages(app, body, res) {
    try {
        const { channelId, limit = 100, createMedia = true } = body;
        
        if (!channelId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                status: 'error', 
                message: 'channelId is required' 
            }));
            return;
        }

        // Fetch messages from the channel
        const messagesResponse = await fetch(`https://cliq.zoho.com/api/v2/channels/${channelId}/messages?limit=${limit}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.ZOHO_CLIQ_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!messagesResponse.ok) {
            throw new Error(`Cliq API error: ${messagesResponse.status} ${messagesResponse.statusText}`);
        }

        const messagesData = await messagesResponse.json();
        const messages = messagesData.messages || [];

        console.log(`Processing ${messages.length} historical messages from channel ${channelId}`);

        const results = [];
        let mediaCreated = 0;

        // Process each message
        for (const message of messages) {
            try {
                // Skip empty messages
                if (!message.text || message.text.trim() === '') {
                    continue;
                }

                // Determine if it's a bot message
                const isBotMessage = message.user?.is_bot || 
                                   message.user?.first_name?.toLowerCase().includes('bot') ||
                                   message.user?.first_name?.toLowerCase().includes('automation');

                // Determine template type
                let templateType = 'chat';
                if (message.text.includes('http') || message.text.includes('www')) {
                    templateType = 'link';
                } else if (message.text.length > 200) {
                    templateType = 'long_message';
                } else if (isBotMessage) {
                    templateType = 'bot_message';
                } else if (message.text.includes('✅') || message.text.includes('❌') || message.text.includes('⚠️')) {
                    templateType = 'status_update';
                }

                const messageData = {
                    message: message.text,
                    sender: message.user?.first_name || 'Unknown',
                    channel: message.channel?.name || 'Unknown',
                    timestamp: message.time,
                    message_id: message.id,
                    is_bot_message: isBotMessage,
                    template_type: templateType
                };

                results.push({
                    message_id: message.id,
                    processed: true,
                    data: messageData
                });

                // Create media if requested
                if (createMedia) {
                    try {
                        // Call the zoho-integration function to create media
                        const mediaResponse = await fetch('http://localhost:3001/server/zoho-integration/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                action: 'processCliqMessage',
                                data: messageData
                            })
                        });

                        if (mediaResponse.ok) {
                            const mediaResult = await mediaResponse.json();
                            if (mediaResult.status === 'success') {
                                mediaCreated++;
                                results[results.length - 1].media_created = true;
                                results[results.length - 1].media_id = mediaResult.media_id;
                            }
                        }
                    } catch (mediaError) {
                        console.error(`Error creating media for message ${message.id}:`, mediaError);
                        results[results.length - 1].media_error = mediaError.message;
                    }
                }

                // Add a small delay to avoid overwhelming the system
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (messageError) {
                console.error(`Error processing message ${message.id}:`, messageError);
                results.push({
                    message_id: message.id,
                    processed: false,
                    error: messageError.message
                });
            }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'success',
            data: {
                channel_id: channelId,
                total_messages: messages.length,
                processed_messages: results.filter(r => r.processed).length,
                media_created: mediaCreated,
                results: results
            },
            message: `Processed ${results.filter(r => r.processed).length} messages, created ${mediaCreated} media items`
        }));

    } catch (error) {
        console.error('Error processing historical messages:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'error', 
            message: error.message 
        }));
    }
}
