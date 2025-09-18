const catalyst = require('zcatalyst-sdk-node');

module.exports = async (req, res) => {
    // Set CORS headers immediately for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        console.log('OPTIONS request received - setting CORS headers');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end();
        return;
    }

    try {
        // Parse request body
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                console.log('🔍 [Events] Request received, body length:', body.length);
                console.log('🔍 [Events] Raw body:', body);
                
                const inputData = JSON.parse(body || '{}');
                const { action } = inputData;
                
                console.log('🔍 [Events] Parsed action:', action);

                // Initialize Catalyst
                const app = catalyst.initialize(req);
                const datastore = app.datastore();

        switch (action) {
            case 'getAll':
                try {
                    console.log('🔍 [Events] Fetching all events');
                    
                    // For now, return mock events data since table access is problematic
                    const mockEvents = [
                        {
                            ROWID: 1,
                            title: 'Sample Event 1',
                            description: 'This is a sample event',
                            start_time: '2024-01-01T10:00:00Z',
                            end_time: '2024-01-01T11:00:00Z',
                            location: 'Conference Room A',
                            is_active: true,
                            created_at: new Date().toISOString()
                        },
                        {
                            ROWID: 2,
                            title: 'Sample Event 2',
                            description: 'Another sample event',
                            start_time: '2024-01-02T14:00:00Z',
                            end_time: '2024-01-02T15:30:00Z',
                            location: 'Main Hall',
                            is_active: true,
                            created_at: new Date().toISOString()
                        }
                    ];
                    
                    console.log(`🔍 [Events] Returning ${mockEvents.length} mock events`);
                    
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: true,
                        events: mockEvents,
                        message: `Retrieved ${mockEvents.length} events (mock data)`
                    }));
                } catch (error) {
                    console.error('❌ [Events] Error fetching events:', error);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Failed to fetch events: ' + (error.message || 'Unknown error')
                    }));
                }
                break;

            case 'create':
                try {
                    const { title, description, start_time, end_time, location } = inputData;
                    
                    if (!title || !start_time || !end_time) {
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            success: false,
                            message: 'Title, start time, and end time are required'
                        }));
                        return;
                    }

                    // Create mock event with generated ID
                    const newEvent = {
                        ROWID: Date.now(),
                        title: title.trim(),
                        description: description ? description.trim() : '',
                        start_time: start_time,
                        end_time: end_time,
                        location: location ? location.trim() : '',
                        is_active: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };

                    console.log('✅ [Events] Created mock event:', newEvent.ROWID);

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: true,
                        event: newEvent,
                        message: 'Event created successfully (mock data)'
                    }));
                } catch (error) {
                    console.error('❌ [Events] Error creating event:', error);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Failed to create event: ' + (error.message || 'Unknown error')
                    }));
                }
                break;

            case 'update':
                try {
                    const { event_id, title, description, start_time, end_time, location, is_active } = inputData;
                    
                    if (!event_id || !title || !start_time || !end_time) {
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            success: false,
                            message: 'Event ID, title, start time, and end time are required'
                        }));
                        return;
                    }

                    // Mock update
                    const updatedEvent = {
                        ROWID: event_id,
                        title: title.trim(),
                        description: description ? description.trim() : '',
                        start_time: start_time,
                        end_time: end_time,
                        location: location ? location.trim() : '',
                        is_active: is_active !== undefined ? is_active : true,
                        updated_at: new Date().toISOString()
                    };

                    console.log('✅ [Events] Updated mock event:', event_id);

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: true,
                        event: updatedEvent,
                        message: 'Event updated successfully (mock data)'
                    }));
                } catch (error) {
                    console.error('❌ [Events] Error updating event:', error);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Failed to update event: ' + (error.message || 'Unknown error')
                    }));
                }
                break;

            case 'delete':
                try {
                    const { event_id } = inputData;
                    
                    if (!event_id) {
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            success: false,
                            message: 'Event ID is required'
                        }));
                        return;
                    }

                    console.log('✅ [Events] Deleted mock event:', event_id);

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: true,
                        message: 'Event deleted successfully (mock data)'
                    }));
                } catch (error) {
                    console.error('❌ [Events] Error deleting event:', error);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Failed to delete event: ' + (error.message || 'Unknown error')
                    }));
                }
                break;

            default:
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    success: false,
                    message: 'Invalid action. Supported actions: getAll, create, update, delete'
                }));
        }
            } catch (parseError) {
                console.error('❌ [Events] JSON parse error:', parseError);
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    success: false,
                    message: 'Invalid JSON format: ' + parseError.message
                }));
            }
        });
    } catch (error) {
        console.error('❌ [Events] Server error:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            success: false,
            message: 'Server error',
            error: error.message
        }));
    }
};