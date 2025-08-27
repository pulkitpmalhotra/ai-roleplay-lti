import { createClient } from '@supabase/supabase-js';

export class SupabaseHelper {
  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase not configured - using mock data');
      this.useMockData = true;
      return;
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.useMockData = false;
  }

  async getAllScenarios() {
    if (this.useMockData) {
      return [
        {
          id: 1,
          title: 'Customer Service Excellence',
          description: 'Practice customer service skills',
          bot_character: 'Customer Service Rep',
          is_active: true
        }
      ];
    }
    
    const { data, error } = await this.supabase
      .from('scenarios')
      .select('*')
      .eq('is_active', true);
    
    if (error) throw error;
    return data || [];
  }

  async createOrUpdateUser(ltiUserId, userData) {
    if (this.useMockData) {
      return { id: 1, ...userData };
    }
    
    const { data, error } = await this.supabase
      .from('users')
      .upsert({ lti_user_id: ltiUserId, ...userData })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}
