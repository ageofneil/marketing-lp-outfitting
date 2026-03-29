module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, boat_type, boat_length, notes, topic, advisor } = req.body;
  const apiKey = process.env.KLAVIYO_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const nameParts = (name || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const headers = {
    'Authorization': `Klaviyo-API-Key ${apiKey}`,
    'Content-Type': 'application/json',
    'revision': '2024-10-15'
  };

  const listId = process.env.KLAVIYO_LIST_ID || 'TGa4Bx';

  try {
    // 1. Create/update profile (synchronous — returns profile ID)
    const profileRes = await fetch('https://a.klaviyo.com/api/profile-import/', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: {
          type: 'profile',
          attributes: {
            email,
            first_name: firstName,
            last_name: lastName,
            properties: { topic, boat_type, boat_length, notes, advisor }
          }
        }
      })
    });
    const profileData = await profileRes.json();
    const profileId = profileData?.data?.id;

    if (!profileId) {
      console.error('Klaviyo profile error:', profileData);
      return res.status(500).json({ error: 'Failed to create profile' });
    }

    // 2. Subscribe profile to list (async job — fires and continues)
    await fetch('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: {
          type: 'profile-subscription-bulk-create-job',
          attributes: {
            profiles: {
              data: [{
                type: 'profile',
                id: profileId,
                attributes: {
                  subscriptions: {
                    email: { marketing: { consent: 'SUBSCRIBED' } }
                  }
                }
              }]
            },
            list_id: listId
          }
        }
      })
    });

    // 3. Track lead submitted event
    await fetch('https://a.klaviyo.com/api/events/', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: {
          type: 'event',
          attributes: {
            metric: { data: { type: 'metric', attributes: { name: 'Lead Submitted' } } },
            profile: { data: { type: 'profile', id: profileId } },
            properties: {
              topic,
              boat_type,
              boat_length,
              notes,
              advisor
            }
          }
        }
      })
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Klaviyo error:', err);
    return res.status(500).json({ error: 'Failed to submit lead' });
  }
};
