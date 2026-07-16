/**
 * Tipos de la base de datos para los clientes de Supabase.
 * Escritos a mano para coincidir con supabase/migrations.
 * (Se pueden regenerar con: supabase gen types typescript)
 */

export type Profile = {
  id: string;
  nickname: string | null;
  avatar_id: string | null;
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
};

export type Team = {
  id: number;
  code: string;
  name: string;
  group_letter: string;
  flag_emoji: string;
};

export type Match = {
  id: number;
  stage: "group" | "r32" | "r16" | "qf" | "sf" | "final" | "third_place";
  group_letter: string | null;
  matchday: number | null;
  bracket_slot: number | null;
  home_team_id: number;
  away_team_id: number;
  kickoff_at: string;
  created_at: string;
};

export type PhaseWindow = {
  phase_key: string;
  label: string;
  opens_at: string;
  locks_at: string;
  updated_at: string;
};

export type Prediction = {
  id: number;
  user_id: string;
  match_id: number;
  home_score: number;
  away_score: number;
  penalty_winner_team_id: number | null;
  created_at: string;
  updated_at: string;
};

export type MatchResult = {
  match_id: number;
  home_score: number;
  away_score: number;
  penalty_winner_team_id: number | null;
  winner_team_id: number | null;
  updated_at: string;
};

export type SpecialPrediction = {
  user_id: string;
  champion_team_id: number | null;
  runner_up_team_id: number | null;
  semifinalist1_id: number | null;
  semifinalist2_id: number | null;
  top_scorer: string | null;
  created_at: string;
  updated_at: string;
};

export type TournamentResults = {
  id: number;
  champion_team_id: number | null;
  runner_up_team_id: number | null;
  semifinalist1_id: number | null;
  semifinalist2_id: number | null;
  top_scorer: string | null;
  updated_at: string;
};

export type LeaderboardRow = {
  user_id: string;
  nickname: string | null;
  avatar_id: string | null;
  match_points: number;
  special_points: number;
  total_points: number;
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile>;
      teams: Table<Team>;
      matches: Table<Match>;
      phase_windows: Table<PhaseWindow>;
      predictions: Table<Prediction>;
      match_results: Table<MatchResult>;
      special_predictions: Table<SpecialPrediction>;
      tournament_results: Table<TournamentResults>;
      admins: Table<{ email: string }>;
    };
    Views: Record<string, never>;
    Functions: {
      get_leaderboard: {
        Args: Record<string, never>;
        Returns: LeaderboardRow[];
      };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_phase_open: { Args: { p_key: string }; Returns: boolean };
      is_knockout_match_open: { Args: { p_match_id: number }; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
