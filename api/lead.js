module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, boat_type, boat_length, notes, topic, advisor } = req.body;
  const apiKey = process.env.HUBSPOT_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  const nameParts = (name || '').trim().split(' ');
  const firstname = nameParts[0] || '';
  const lastname = nameParts.slice(1).join(' ') || '';

  try {
    // 1. Create contact — handle duplicate email (409)
    let contactId;
    const contactRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers,
      body: JSON.stringify({ properties: { firstname, lastname, email } })
    });

    if (contactRes.status === 409) {
      const searchRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }]
        })
      });
      const searchData = await searchRes.json();
      contactId = searchData.results?.[0]?.id;
    } else {
      const contactData = await contactRes.json();
      contactId = contactData.id;
    }

    // 2. Create deal
    const description = [
      `Service: ${topic}`,
      `Boat: ${boat_type}, ${boat_length}`,
      `Matched advisor: ${advisor}`,
      notes ? `Notes: ${notes}` : ''
    ].filter(Boolean).join('\n');

    const dealRes = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        properties: {
          dealname: `${name} — ${topic}`,
          dealstage: 'appointmentscheduled',
          pipeline: 'default',
          description
        }
      })
    });
    const dealData = await dealRes.json();
    const dealId = dealData.id;

    // 3. Associate contact with deal
    if (contactId && dealId) {
      await fetch('https://api.hubapi.com/crm/v3/associations/contacts/deals/batch/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inputs: [{ from: { id: contactId }, to: { id: dealId }, type: 'contact_to_deal' }]
        })
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('HubSpot error:', err);
    return res.status(500).json({ error: 'Failed to submit lead' });
  }
}
