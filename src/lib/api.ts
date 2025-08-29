const PROXY_URL = 'https://salesys.se/api/tools/proxy.php';

export interface BlacklistItem {
  id: string;
  name: string;
  isGlobal: boolean;
  organizationId: string;
}

export interface BlacklistString {
  id: string;
  listId: string;
  string: string;
  organizationId: string;
}

export class ApiClient {
  private bearerToken: string;

  constructor(bearerToken: string) {
    this.bearerToken = bearerToken;
  }

  private async makeRequest(url: string): Promise<any> {
    const proxyUrl = `${PROXY_URL}?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.bearerToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getBlacklists(): Promise<BlacklistItem[]> {
    return this.makeRequest('https://app.salesys.se/api/contacts/exclude-lists-v1');
  }

  async getBlacklistStrings(
    listIds: string[], 
    offset: number = 0, 
    count: number = 50
  ): Promise<BlacklistString[]> {
    const listIdsParam = listIds.join(',');
    const url = `https://app.salesys.se/api/contacts/exclude-lists-v1/strings?listIds=${listIdsParam}&count=${count}&includeGlobal=false&isNormalizedString=false&offset=${offset}`;
    return this.makeRequest(url);
  }
}