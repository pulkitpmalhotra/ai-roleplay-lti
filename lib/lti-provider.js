const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class LTIProvider {
  constructor(options = {}) {
    this.ltiKey = options.ltiKey || process.env.LTI_KEY;
    this.ltiSecret = options.ltiSecret || process.env.LTI_SECRET;
    this.appUrl = options.appUrl || process.env.APP_URL;
  }

  // LTI 1.1 Launch Validation
  validateLTI11Launch(params, signature, method = 'POST', url) {
    try {
      const baseString = this.generateBaseString(method, url, params);
      const key = `${this.ltiSecret}&`;
      const computedSignature = crypto
        .createHmac('sha1', key)
        .update(baseString)
        .digest('base64');

      return computedSignature === signature;
    } catch (error) {
      console.error('LTI 1.1 validation error:', error);
      return false;
    }
  }

  // LTI 1.3 JWT Validation (simplified)
  validateLTI13Launch(token) {
    try {
      const decoded = jwt.verify(token, this.ltiSecret);
      
      // Validate required claims
      if (!decoded.sub || !decoded.iss || !decoded.aud) {
        return null;
      }

      return decoded;
    } catch (error) {
      console.error('LTI 1.3 validation error:', error);
      return null;
    }
  }

  // Generate OAuth base string for LTI 1.1
  generateBaseString(method, url, params) {
    const normalizedParams = this.normalizeParams(params);
    const encodedParams = this.encodeParams(normalizedParams);
    
    return [
      method.toUpperCase(),
      this.encodeURIComponent(url),
      this.encodeURIComponent(encodedParams)
    ].join('&');
  }

  normalizeParams(params) {
    const normalized = {};
    for (const [key, value] of Object.entries(params)) {
      if (key !== 'oauth_signature') {
        normalized[this.encodeURIComponent(key)] = this.encodeURIComponent(value);
      }
    }
    return normalized;
  }

  encodeParams(params) {
    return Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  }

  encodeURIComponent(str) {
    return encodeURIComponent(str)
      .replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  }

  // Extract user information from LTI launch
  extractUserInfo(params) {
    return {
      ltiUserId: params.user_id || params.sub,
      name: params.lis_person_name_full || params.name || 'Unknown User',
      email: params.lis_person_contact_email_primary || params.email,
      role: this.mapRole(params.roles || params.ext_roles),
      contextId: params.context_id || params['https://purl.imsglobal.org/spec/lti/claim/context']?.id,
      resourceLinkId: params.resource_link_id || params['https://purl.imsglobal.org/spec/lti/claim/resource_link']?.id
    };
  }

  mapRole(rolesString) {
    if (!rolesString) return 'student';
    
    const roles = rolesString.toLowerCase();
    if (roles.includes('instructor') || roles.includes('teacher')) return 'instructor';
    if (roles.includes('admin')) return 'admin';
    return 'student';
  }

  // Grade passback for LTI 1.1
  async sendGrade(outcomeServiceUrl, sourcedId, score) {
    if (!outcomeServiceUrl || !sourcedId) {
      console.log('Missing outcome service URL or sourcedId for grade passback');
      return false;
    }

    try {
      const xmlBody = this.generateGradeXML(sourcedId, score);
      const signature = this.generateGradeSignature(outcomeServiceUrl, xmlBody);

      const response = await fetch(outcomeServiceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
          'Authorization': `OAuth ${signature}`
        },
        body: xmlBody
      });

      return response.ok;
    } catch (error) {
      console.error('Grade passback error:', error);
      return false;
    }
  }

  generateGradeXML(sourcedId, score) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<imsx_POXEnvelopeRequest xmlns="http://www.imsglobal.org/services/ltiv1p1/xsd/imsoms_v1p0">
  <imsx_POXHeader>
    <imsx_POXRequestHeaderInfo>
      <imsx_version>V1.0</imsx_version>
      <imsx_messageIdentifier>${crypto.randomUUID()}</imsx_messageIdentifier>
    </imsx_POXRequestHeaderInfo>
  </imsx_POXHeader>
  <imsx_POXBody>
    <replaceResultRequest>
      <resultRecord>
        <sourcedGUID>
          <sourcedId>${sourcedId}</sourcedId>
        </sourcedGUID>
        <result>
          <resultScore>
            <language>en</language>
            <textString>${score}</textString>
          </resultScore>
        </result>
      </resultRecord>
    </replaceResultRequest>
  </imsx_POXBody>
</imsx_POXEnvelopeRequest>`;
  }

  generateGradeSignature(url, body) {
    // Simplified signature generation for grade passback
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(16).toString('hex');
    
    const params = {
      oauth_consumer_key: this.ltiKey,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_nonce: nonce,
      oauth_version: '1.0'
    };

    const baseString = this.generateBaseString('POST', url, params);
    const key = `${this.ltiSecret}&`;
    const signature = crypto.createHmac('sha1', key).update(baseString).digest('base64');

    return `oauth_consumer_key="${this.ltiKey}", oauth_signature_method="HMAC-SHA1", oauth_timestamp="${timestamp}", oauth_nonce="${nonce}", oauth_version="1.0", oauth_signature="${signature}"`;
  }

  // Create session token for roleplay session
  createSessionToken(userId, scenarioId, ltiContext) {
    const payload = {
      userId,
      scenarioId,
      contextId: ltiContext.contextId,
      resourceLinkId: ltiContext.resourceLinkId,
      timestamp: Date.now()
    };

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
  }

  // Validate session token
  validateSessionToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.error('Session token validation error:', error);
      return null;
    }
  }
}

module.exports = LTIProvider;