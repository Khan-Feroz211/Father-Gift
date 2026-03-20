export type CaseType =
  | 'criminal'
  | 'civil'
  | 'family'
  | 'constitutional'
  | 'commercial'
  | 'writ'
  | 'revenue'
  | 'labour'
  | 'other'

export type CaseStatus =
  | 'active'
  | 'pending'
  | 'disposed'
  | 'adjourned'
  | 'stayed'
  | 'appealed'

export type HearingPurpose =
  | 'arguments'
  | 'evidence'
  | 'framing_charges'
  | 'bail'
  | 'judgment'
  | 'written_statement'
  | 'mediation'
  | 'other'

export type DocumentType =
  | 'vakalatnama'
  | 'bail_application'
  | 'written_statement'
  | 'constitutional_petition'
  | 'civil_plaint'
  | 'injunction'
  | 'appeal'
  | 'revision'
  | 'general_application'

export interface User {
  id: string
  email: string
  full_name: string
  bar_number?: string | null
  court_name?: string | null
  phone?: string | null
  is_active: boolean
}

export interface Client {
  id: string
  user_id: string
  full_name: string
  cnic?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
  is_organization: boolean
  ntn?: string | null
  created_at: string
  updated_at: string
}

export interface Case {
  id: string
  user_id: string
  client_id?: string | null
  title: string
  case_type: CaseType
  status: CaseStatus
  case_number?: string | null
  court_name?: string | null
  court_district?: string | null
  judge_name?: string | null
  opponent_name?: string | null
  opponent_advocate?: string | null
  fir_number?: string | null
  ps_name?: string | null
  filing_date?: string | null
  next_hearing_date?: string | null
  facts?: string | null
  legal_issues?: string | null
  notes?: string | null
  tags?: string[] | null
  created_at: string
  updated_at: string
}

export interface Hearing {
  id: string
  case_id: string
  hearing_date: string
  hearing_time?: string | null
  courtroom?: string | null
  purpose: HearingPurpose
  outcome?: string | null
  next_date_set?: string | null
  notes?: string | null
  reminder_sent: boolean
  created_at: string
}

export interface Document {
  id: string
  case_id: string
  document_type: DocumentType
  title: string
  content?: string | null
  file_path?: string | null
  generated_at?: string | null
  created_at: string
}

export interface SearchResult {
  case_id: string
  title: string
  case_type: string
  status: string
  score: number
  similarity_percent: number
  snippet?: string | null
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface ApiError {
  detail: string | { msg: string; type: string }[]
}
