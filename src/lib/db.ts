import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// Environment variables will be provided via Vercel or .env file
const supabaseUrl = import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Volunteers table
export async function createVolunteer(data: {
  name: string;
  email: string;
  phone: string;
  expertise: string;
  message: string;
}) {
  const { data: result, error } = await supabase
    .from('oiac_volunteers')
    .insert([{
      name: data.name,
      email: data.email,
      phone: data.phone,
      expertise: data.expertise,
      message: data.message,
    }])
    .select();

  if (error) {
    throw error;
  }

  return result;
}

export async function getVolunteerByEmail(email: string) {
  const { data, error } = await supabase
    .from('oiac_volunteers')
    .select('*')
    .eq('email', email);

  if (error) {
    throw error;
  }

  return data || [];
}

// UTM Hits table
export async function createUtmHit(data: {
  source: string;
  timestamp: Date;
  donateButtonClicked: boolean;
}) {
  const { data: result, error } = await supabase
    .from('oiac_utm_hits')
    .insert([{
      source: data.source,
      timestamp: data.timestamp.toISOString(),
      donate_button_clicked: data.donateButtonClicked,
    }])
    .select();

  if (error) {
    throw error;
  }

  return result;
}

export async function getUtmHits() {
  const { data, error } = await supabase
    .from('oiac_utm_hits')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

// New Centre Updates table
export type NewCentreUpdateLink = {
  url: string;
  title: string;
  description?: string;
};

export type NewCentreUpdateInput = {
  title: string;
  description?: string;
  date: string;
  mediaType?: 'images' | 'video' | 'mixed'; // Now optional, can have any combination
  images?: Array<{ url: string }>;
  videoUrl?: string;
  links?: NewCentreUpdateLink[];
  displayOrder?: number;
};

export type NewCentreUpdateRecord = NewCentreUpdateInput & {
  id: string;
  created_at: string;
  updated_at: string;
};

export async function createNewCentreUpdate(data: NewCentreUpdateInput) {
  const { data: result, error } = await supabase
    .from('oiac_newcentre_updates')
    .insert([{
      title: data.title,
      description: data.description || null,
      date: data.date,
      media_type: data.mediaType || null,
      images: data.images || [],
      video_url: data.videoUrl || null,
      links: data.links || [],
      display_order: data.displayOrder || null,
    }])
    .select();

  if (error) {
    throw error;
  }

  return result;
}

export async function getNewCentreUpdates(): Promise<NewCentreUpdateRecord[]> {
  const { data, error } = await supabase
    .from('oiac_newcentre_updates')
    .select('*')
    .order('date', { ascending: false })
    .order('display_order', { ascending: true, nullsFirst: false });

  if (error) {
    throw error;
  }

  return (data || []).map(record => ({
    id: record.id,
    title: record.title,
    description: record.description,
    date: record.date,
    mediaType: record.media_type,
    images: record.images || [],
    videoUrl: record.video_url,
    links: record.links || [],
    displayOrder: record.display_order,
    created_at: record.created_at,
    updated_at: record.updated_at,
  }));
}

export async function getNewCentreUpdateById(id: string): Promise<NewCentreUpdateRecord | null> {
  const { data, error } = await supabase
    .from('oiac_newcentre_updates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    date: data.date,
    mediaType: data.media_type,
    images: data.images || [],
    videoUrl: data.video_url,
    links: data.links || [],
    displayOrder: data.display_order,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function updateNewCentreUpdate(id: string, data: Partial<NewCentreUpdateInput>) {
  const updateData: Record<string, unknown> = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.date !== undefined) updateData.date = data.date;
  if (data.mediaType !== undefined) updateData.media_type = data.mediaType;
  if (data.images !== undefined) updateData.images = data.images;
  if (data.videoUrl !== undefined) updateData.video_url = data.videoUrl;
  if (data.links !== undefined) updateData.links = data.links;
  if (data.displayOrder !== undefined) updateData.display_order = data.displayOrder;

  const { data: result, error } = await supabase
    .from('oiac_newcentre_updates')
    .update(updateData)
    .eq('id', id)
    .select();

  if (error) {
    throw error;
  }

  return result;
}

export async function deleteNewCentreUpdate(id: string) {
  const { error } = await supabase
    .from('oiac_newcentre_updates')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }

  return true;
}

// Slideshow items table
export type SlideshowItemInput = {
  title: string;
  description?: string;
  url: string;
  thumbnail?: string;
  videoType: 'youtube' | 'facebook' | 'other';
  featured?: boolean;
  displayOrder?: number;
};

export type SlideshowItemRecord = SlideshowItemInput & {
  id: string;
  created_at: string;
  updated_at: string;
};

function mapSlideshowRecord(record: Record<string, any>): SlideshowItemRecord {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    url: record.url,
    thumbnail: record.thumbnail,
    videoType: record.video_type,
    featured: record.featured,
    displayOrder: record.display_order,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

export async function createSlideshowItem(data: SlideshowItemInput): Promise<SlideshowItemRecord[]> {
  const { data: result, error } = await supabase
    .from('oiac_slideshow')
    .insert([{
      title: data.title,
      description: data.description || null,
      url: data.url,
      thumbnail: data.thumbnail || null,
      video_type: data.videoType,
      featured: data.featured ?? false,
      display_order: data.displayOrder || null,
    }])
    .select();

  if (error) throw error;
  return (result || []).map(mapSlideshowRecord);
}

export async function getSlideshowItems(): Promise<SlideshowItemRecord[]> {
  const { data, error } = await supabase
    .from('oiac_slideshow')
    .select('*')
    .order('display_order', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data || []).map(mapSlideshowRecord);
}

export async function getSlideshowItemById(id: string): Promise<SlideshowItemRecord | null> {
  const { data, error } = await supabase
    .from('oiac_slideshow')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return mapSlideshowRecord(data);
}

export async function updateSlideshowItem(id: string, data: Partial<SlideshowItemInput>) {
  const updateData: Record<string, unknown> = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.url !== undefined) updateData.url = data.url;
  if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail;
  if (data.videoType !== undefined) updateData.video_type = data.videoType;
  if (data.featured !== undefined) updateData.featured = data.featured;
  if (data.displayOrder !== undefined) updateData.display_order = data.displayOrder;

  const { data: result, error } = await supabase
    .from('oiac_slideshow')
    .update(updateData)
    .eq('id', id)
    .select();

  if (error) throw error;
  return result;
}

export async function deleteSlideshowItem(id: string) {
  const { error } = await supabase
    .from('oiac_slideshow')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// Posters table
export type PosterInput = {
  title: string;
  imageUrl: string;
  linkText?: string;
  linkUrl?: string;
  link2Text?: string;
  link2Url?: string;
  displayOrder?: number;
};

export type PosterRecord = PosterInput & {
  id: string;
  created_at: string;
  updated_at: string;
};

function mapPosterRecord(record: Record<string, any>): PosterRecord {
  return {
    id: record.id,
    title: record.title,
    imageUrl: record.image_url,
    linkText: record.link_text,
    linkUrl: record.link_url,
    link2Text: record.link2_text,
    link2Url: record.link2_url,
    displayOrder: record.display_order,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

export async function shiftPosterOrders(): Promise<void> {
  const { data, error } = await supabase
    .from('oiac_posters')
    .select('id, display_order');

  if (error) throw error;

  for (const poster of (data || [])) {
    await supabase
      .from('oiac_posters')
      .update({ display_order: (poster.display_order || 0) + 1 })
      .eq('id', poster.id);
  }
}

export async function createPoster(data: PosterInput): Promise<PosterRecord[]> {
  const { data: result, error } = await supabase
    .from('oiac_posters')
    .insert([{
      title: data.title,
      image_url: data.imageUrl,
      link_text: data.linkText || null,
      link_url: data.linkUrl || null,
      link2_text: data.link2Text || null,
      link2_url: data.link2Url || null,
      display_order: data.displayOrder || null,
    }])
    .select();

  if (error) throw error;
  return (result || []).map(mapPosterRecord);
}

export async function getPosters(): Promise<PosterRecord[]> {
  const { data, error } = await supabase
    .from('oiac_posters')
    .select('*')
    .order('display_order', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data || []).map(mapPosterRecord);
}

export async function getPosterById(id: string): Promise<PosterRecord | null> {
  const { data, error } = await supabase
    .from('oiac_posters')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return mapPosterRecord(data);
}

export async function updatePoster(id: string, data: Partial<PosterInput>) {
  const updateData: Record<string, unknown> = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
  if (data.linkText !== undefined) updateData.link_text = data.linkText;
  if (data.linkUrl !== undefined) updateData.link_url = data.linkUrl;
  if (data.link2Text !== undefined) updateData.link2_text = data.link2Text;
  if (data.link2Url !== undefined) updateData.link2_url = data.link2Url;
  if (data.displayOrder !== undefined) updateData.display_order = data.displayOrder;

  const { data: result, error } = await supabase
    .from('oiac_posters')
    .update(updateData)
    .eq('id', id)
    .select();

  if (error) throw error;
  return result;
}

export async function deletePoster(id: string) {
  const { error } = await supabase
    .from('oiac_posters')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// Feedback table
export type FeedbackInput = {
  name?: string;
  email?: string;
  category: 'feedback' | 'suggestion' | 'complaint';
  message: string;
};

export type FeedbackRecord = FeedbackInput & {
  id: string;
  status: 'new' | 'viewed';
  created_at: string;
  updated_at: string;
};

export async function createFeedback(data: FeedbackInput): Promise<FeedbackRecord[]> {
  const { data: result, error } = await supabase
    .from('oiac_feedback')
    .insert([{
      name: data.name || null,
      email: data.email || null,
      category: data.category,
      message: data.message,
    }])
    .select();

  if (error) throw error;
  return result as FeedbackRecord[];
}

export async function getFeedbacks(): Promise<FeedbackRecord[]> {
  const { data, error } = await supabase
    .from('oiac_feedback')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as FeedbackRecord[];
}

export async function getFeedbackById(id: string): Promise<FeedbackRecord | null> {
  const { data, error } = await supabase
    .from('oiac_feedback')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as FeedbackRecord;
}

export async function updateFeedback(id: string, data: { status: string }) {
  const { data: result, error } = await supabase
    .from('oiac_feedback')
    .update({ status: data.status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select();

  if (error) throw error;
  return result;
}

export async function deleteFeedback(id: string) {
  const { error } = await supabase
    .from('oiac_feedback')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// Jummah Times table
export type JummahTimeInput = {
  name: string;
  time: string;
  displayOrder?: number;
};

export type JummahTimeRecord = JummahTimeInput & {
  id: string;
  created_at: string;
  updated_at: string;
};

function mapJummahTimeRecord(record: Record<string, any>): JummahTimeRecord {
  return {
    id: record.id,
    name: record.name,
    time: record.time,
    displayOrder: record.display_order,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

export async function createJummahTime(data: JummahTimeInput): Promise<JummahTimeRecord[]> {
  const { data: result, error } = await supabase
    .from('oiac_jummah_times')
    .insert([{
      name: data.name,
      time: data.time,
      display_order: data.displayOrder || 0,
    }])
    .select();

  if (error) throw error;
  return (result || []).map(mapJummahTimeRecord);
}

export async function getJummahTimesFromDB(): Promise<JummahTimeRecord[]> {
  const { data, error } = await supabase
    .from('oiac_jummah_times')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapJummahTimeRecord);
}

export async function getJummahTimeById(id: string): Promise<JummahTimeRecord | null> {
  const { data, error } = await supabase
    .from('oiac_jummah_times')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return mapJummahTimeRecord(data);
}

export async function updateJummahTime(id: string, data: Partial<JummahTimeInput>) {
  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.time !== undefined) updateData.time = data.time;
  if (data.displayOrder !== undefined) updateData.display_order = data.displayOrder;

  const { data: result, error } = await supabase
    .from('oiac_jummah_times')
    .update(updateData)
    .eq('id', id)
    .select();

  if (error) throw error;
  return result;
}

export async function deleteJummahTime(id: string) {
  const { error } = await supabase
    .from('oiac_jummah_times')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// Jobs table
export type JobInput = {
  title: string;
  postedDate: string;
  description?: string;
  requireAlbertaCertification?: boolean;
  active?: boolean;
  images?: Array<{ url: string }>;
};

export type JobRecord = JobInput & {
  id: string;
  created_at: string;
  updated_at: string;
};

function mapJobRecord(record: Record<string, any>): JobRecord {
  return {
    id: record.id,
    title: record.title,
    postedDate: record.posted_date,
    description: record.description,
    requireAlbertaCertification: record.require_alberta_certification,
    active: record.active,
    images: record.images || [],
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

export async function createJob(data: JobInput): Promise<JobRecord[]> {
  const { data: result, error } = await supabase
    .from('oiac_jobs')
    .insert([{
      title: data.title,
      posted_date: data.postedDate,
      description: data.description || null,
      require_alberta_certification: data.requireAlbertaCertification ?? false,
      active: data.active ?? true,
      images: data.images || [],
    }])
    .select();

  if (error) throw error;
  return (result || []).map(mapJobRecord);
}

export async function getJobsFromDB(): Promise<JobRecord[]> {
  const { data, error } = await supabase
    .from('oiac_jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapJobRecord);
}

export async function getJobById(id: string): Promise<JobRecord | null> {
  const { data, error } = await supabase
    .from('oiac_jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return mapJobRecord(data);
}

export async function updateJob(id: string, data: Partial<JobInput>) {
  const updateData: Record<string, unknown> = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.postedDate !== undefined) updateData.posted_date = data.postedDate;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.requireAlbertaCertification !== undefined) updateData.require_alberta_certification = data.requireAlbertaCertification;
  if (data.active !== undefined) updateData.active = data.active;
  if (data.images !== undefined) updateData.images = data.images;

  const { data: result, error } = await supabase
    .from('oiac_jobs')
    .update(updateData)
    .eq('id', id)
    .select();

  if (error) throw error;
  return result;
}

export async function deleteJob(id: string) {
  const { error } = await supabase
    .from('oiac_jobs')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// Staff table
export type StaffInput = {
  name: string;
  title?: string;
  displayOrder?: number;
  profilePictureUrl?: string;
  staffType: string;
  description?: string;
};

export type StaffRecord = StaffInput & {
  id: string;
  created_at: string;
  updated_at: string;
};

function mapStaffRecord(record: Record<string, any>): StaffRecord {
  return {
    id: record.id,
    name: record.name,
    title: record.title,
    displayOrder: record.display_order,
    profilePictureUrl: record.profile_picture_url,
    staffType: record.staff_type,
    description: record.description,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

export async function createStaffMember(data: StaffInput): Promise<StaffRecord[]> {
  const { data: result, error } = await supabase
    .from('oiac_staff')
    .insert([{
      name: data.name,
      title: data.title || null,
      display_order: data.displayOrder || 0,
      profile_picture_url: data.profilePictureUrl || null,
      staff_type: data.staffType,
      description: data.description || null,
    }])
    .select();

  if (error) throw error;
  return (result || []).map(mapStaffRecord);
}

export async function getStaffFromDB(): Promise<StaffRecord[]> {
  const { data, error } = await supabase
    .from('oiac_staff')
    .select('*')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapStaffRecord);
}

export async function getStaffByType(staffType: string): Promise<StaffRecord[]> {
  const { data, error } = await supabase
    .from('oiac_staff')
    .select('*')
    .eq('staff_type', staffType)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapStaffRecord);
}

export async function getStaffMemberById(id: string): Promise<StaffRecord | null> {
  const { data, error } = await supabase
    .from('oiac_staff')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return mapStaffRecord(data);
}

export async function updateStaffMember(id: string, data: Partial<StaffInput>) {
  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.displayOrder !== undefined) updateData.display_order = data.displayOrder;
  if (data.profilePictureUrl !== undefined) updateData.profile_picture_url = data.profilePictureUrl;
  if (data.staffType !== undefined) updateData.staff_type = data.staffType;
  if (data.description !== undefined) updateData.description = data.description;

  const { data: result, error } = await supabase
    .from('oiac_staff')
    .update(updateData)
    .eq('id', id)
    .select();

  if (error) throw error;
  return result;
}

export async function deleteStaffMember(id: string) {
  const { error } = await supabase
    .from('oiac_staff')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// Prayer Times table
export type PrayerTimeInput = {
  month: number;
  day: number;
  fajrBegins: string;
  fajrJamah: string;
  sunrise: string;
  zuhrBegins: string;
  zuhrJamah: string;
  asrBegins: string;
  asrJamah: string;
  maghribBegins: string;
  maghribJamah: string;
  ishaBegins: string;
  ishaJamah: string;
};

export type PrayerTimeRecord = PrayerTimeInput & {
  id: string;
  created_at: string;
  updated_at: string;
};

function mapPrayerTimeRecord(record: Record<string, any>): PrayerTimeRecord {
  return {
    id: record.id,
    month: record.month,
    day: record.day,
    fajrBegins: record.fajr_begins,
    fajrJamah: record.fajr_jamah,
    sunrise: record.sunrise,
    zuhrBegins: record.zuhr_begins,
    zuhrJamah: record.zuhr_jamah,
    asrBegins: record.asr_begins,
    asrJamah: record.asr_jamah,
    maghribBegins: record.maghrib_begins,
    maghribJamah: record.maghrib_jamah,
    ishaBegins: record.isha_begins,
    ishaJamah: record.isha_jamah,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

export async function createPrayerTime(data: PrayerTimeInput): Promise<PrayerTimeRecord[]> {
  const { data: result, error } = await supabase
    .from('oiac_prayer_times')
    .insert([{
      month: data.month,
      day: data.day,
      fajr_begins: data.fajrBegins,
      fajr_jamah: data.fajrJamah,
      sunrise: data.sunrise,
      zuhr_begins: data.zuhrBegins,
      zuhr_jamah: data.zuhrJamah,
      asr_begins: data.asrBegins,
      asr_jamah: data.asrJamah,
      maghrib_begins: data.maghribBegins,
      maghrib_jamah: data.maghribJamah,
      isha_begins: data.ishaBegins,
      isha_jamah: data.ishaJamah,
    }])
    .select();

  if (error) throw error;
  return (result || []).map(mapPrayerTimeRecord);
}

export async function getPrayerTimesFromDB(): Promise<PrayerTimeRecord[]> {
  const { data, error } = await supabase
    .from('oiac_prayer_times')
    .select('*')
    .order('month', { ascending: true })
    .order('day', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapPrayerTimeRecord);
}

export async function getPrayerTimesByMonth(month: number): Promise<PrayerTimeRecord[]> {
  const { data, error } = await supabase
    .from('oiac_prayer_times')
    .select('*')
    .eq('month', month)
    .order('day', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapPrayerTimeRecord);
}

export async function getPrayerTimeByDay(month: number, day: number): Promise<PrayerTimeRecord | null> {
  const { data, error } = await supabase
    .from('oiac_prayer_times')
    .select('*')
    .eq('month', month)
    .eq('day', day)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return mapPrayerTimeRecord(data);
}

export async function getPrayerTimeById(id: string): Promise<PrayerTimeRecord | null> {
  const { data, error } = await supabase
    .from('oiac_prayer_times')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return mapPrayerTimeRecord(data);
}

export async function updatePrayerTime(id: string, data: Partial<PrayerTimeInput>) {
  const updateData: Record<string, unknown> = {};

  if (data.month !== undefined) updateData.month = data.month;
  if (data.day !== undefined) updateData.day = data.day;
  if (data.fajrBegins !== undefined) updateData.fajr_begins = data.fajrBegins;
  if (data.fajrJamah !== undefined) updateData.fajr_jamah = data.fajrJamah;
  if (data.sunrise !== undefined) updateData.sunrise = data.sunrise;
  if (data.zuhrBegins !== undefined) updateData.zuhr_begins = data.zuhrBegins;
  if (data.zuhrJamah !== undefined) updateData.zuhr_jamah = data.zuhrJamah;
  if (data.asrBegins !== undefined) updateData.asr_begins = data.asrBegins;
  if (data.asrJamah !== undefined) updateData.asr_jamah = data.asrJamah;
  if (data.maghribBegins !== undefined) updateData.maghrib_begins = data.maghribBegins;
  if (data.maghribJamah !== undefined) updateData.maghrib_jamah = data.maghribJamah;
  if (data.ishaBegins !== undefined) updateData.isha_begins = data.ishaBegins;
  if (data.ishaJamah !== undefined) updateData.isha_jamah = data.ishaJamah;

  const { data: result, error } = await supabase
    .from('oiac_prayer_times')
    .update(updateData)
    .eq('id', id)
    .select();

  if (error) throw error;
  return result;
}

export async function deletePrayerTime(id: string) {
  const { error } = await supabase
    .from('oiac_prayer_times')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function bulkUpsertPrayerTimes(records: PrayerTimeInput[]): Promise<number> {
  const rows = records.map(record => ({
    month: record.month,
    day: record.day,
    fajr_begins: record.fajrBegins,
    fajr_jamah: record.fajrJamah,
    sunrise: record.sunrise,
    zuhr_begins: record.zuhrBegins,
    zuhr_jamah: record.zuhrJamah,
    asr_begins: record.asrBegins,
    asr_jamah: record.asrJamah,
    maghrib_begins: record.maghribBegins,
    maghrib_jamah: record.maghribJamah,
    isha_begins: record.ishaBegins,
    isha_jamah: record.ishaJamah,
  }));

  // Batch in chunks of 50 to avoid payload limits
  let success = 0;
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase
      .from('oiac_prayer_times')
      .upsert(batch, { onConflict: 'month,day' });

    if (error) throw error;
    success += batch.length;
  }
  return success;
}

// Announcements table (site-wide banner)
export type AnnouncementInput = {
  title: string;
  description?: string;
  eventDate?: string;
  eventTime?: string;
  venue?: string;
  posterImageUrl?: string;
  linkUrl?: string;
  linkLabel?: string;
  link2Url?: string;
  link2Label?: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive?: boolean;
};

export type AnnouncementRecord = AnnouncementInput & {
  id: string;
  created_at: string;
  updated_at: string;
};

function mapAnnouncementRecord(record: Record<string, any>): AnnouncementRecord {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    eventDate: record.event_date,
    eventTime: record.event_time,
    venue: record.venue,
    posterImageUrl: record.poster_image_url,
    linkUrl: record.link_url,
    linkLabel: record.link_label,
    link2Url: record.link2_url,
    link2Label: record.link2_label,
    contactPhone: record.contact_phone,
    contactEmail: record.contact_email,
    isActive: record.is_active,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

export async function createAnnouncement(data: AnnouncementInput): Promise<AnnouncementRecord[]> {
  const { data: result, error } = await supabase
    .from('oiac_announcements')
    .insert([{
      title: data.title,
      description: data.description || null,
      event_date: data.eventDate || null,
      event_time: data.eventTime || null,
      venue: data.venue || null,
      poster_image_url: data.posterImageUrl || null,
      link_url: data.linkUrl || null,
      link_label: data.linkLabel || 'Learn More',
      link2_url: data.link2Url || null,
      link2_label: data.link2Label || null,
      contact_phone: data.contactPhone || null,
      contact_email: data.contactEmail || null,
      is_active: data.isActive ?? false,
    }])
    .select();

  if (error) throw error;
  return (result || []).map(mapAnnouncementRecord);
}

export async function getAnnouncements(): Promise<AnnouncementRecord[]> {
  const { data, error } = await supabase
    .from('oiac_announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapAnnouncementRecord);
}

export async function getAnnouncementById(id: string): Promise<AnnouncementRecord | null> {
  const { data, error } = await supabase
    .from('oiac_announcements')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return mapAnnouncementRecord(data);
}

export async function getActiveAnnouncement(): Promise<AnnouncementRecord | null> {
  const { data, error } = await supabase
    .from('oiac_announcements')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapAnnouncementRecord(data);
}

export async function deactivateAllAnnouncements(): Promise<void> {
  const { error } = await supabase
    .from('oiac_announcements')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('is_active', true);

  if (error) throw error;
}

export async function updateAnnouncement(id: string, data: Partial<AnnouncementInput>) {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.eventDate !== undefined) updateData.event_date = data.eventDate;
  if (data.eventTime !== undefined) updateData.event_time = data.eventTime;
  if (data.venue !== undefined) updateData.venue = data.venue;
  if (data.posterImageUrl !== undefined) updateData.poster_image_url = data.posterImageUrl;
  if (data.linkUrl !== undefined) updateData.link_url = data.linkUrl;
  if (data.linkLabel !== undefined) updateData.link_label = data.linkLabel;
  if (data.link2Url !== undefined) updateData.link2_url = data.link2Url;
  if (data.link2Label !== undefined) updateData.link2_label = data.link2Label;
  if (data.contactPhone !== undefined) updateData.contact_phone = data.contactPhone;
  if (data.contactEmail !== undefined) updateData.contact_email = data.contactEmail;
  if (data.isActive !== undefined) updateData.is_active = data.isActive;

  const { data: result, error } = await supabase
    .from('oiac_announcements')
    .update(updateData)
    .eq('id', id)
    .select();

  if (error) throw error;
  return result;
}

export async function deleteAnnouncement(id: string) {
  const { error } = await supabase
    .from('oiac_announcements')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// Popups table (homepage popup poster)
export type PopupInput = {
  title: string;
  imageUrl: string;
  linkUrl?: string;
  linkLabel?: string;
  isActive?: boolean;
};

export type PopupRecord = PopupInput & {
  id: string;
  created_at: string;
  updated_at: string;
};

function mapPopupRecord(record: Record<string, any>): PopupRecord {
  return {
    id: record.id,
    title: record.title,
    imageUrl: record.image_url,
    linkUrl: record.link_url,
    linkLabel: record.link_label,
    isActive: record.is_active,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

export async function createPopup(data: PopupInput): Promise<PopupRecord[]> {
  const { data: result, error } = await supabase
    .from('oiac_popups')
    .insert([{
      title: data.title,
      image_url: data.imageUrl,
      link_url: data.linkUrl || null,
      link_label: data.linkLabel || 'Learn More',
      is_active: data.isActive ?? false,
    }])
    .select();

  if (error) throw error;
  return (result || []).map(mapPopupRecord);
}

export async function getPopups(): Promise<PopupRecord[]> {
  const { data, error } = await supabase
    .from('oiac_popups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapPopupRecord);
}

export async function getPopupById(id: string): Promise<PopupRecord | null> {
  const { data, error } = await supabase
    .from('oiac_popups')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return mapPopupRecord(data);
}

export async function getActivePopup(): Promise<PopupRecord | null> {
  const { data, error } = await supabase
    .from('oiac_popups')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapPopupRecord(data);
}

export async function deactivateAllPopups(): Promise<void> {
  const { error } = await supabase
    .from('oiac_popups')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('is_active', true);

  if (error) throw error;
}

export async function updatePopup(id: string, data: Partial<PopupInput>) {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
  if (data.linkUrl !== undefined) updateData.link_url = data.linkUrl;
  if (data.linkLabel !== undefined) updateData.link_label = data.linkLabel;
  if (data.isActive !== undefined) updateData.is_active = data.isActive;

  const { data: result, error } = await supabase
    .from('oiac_popups')
    .update(updateData)
    .eq('id', id)
    .select();

  if (error) throw error;
  return result;
}

export async function deletePopup(id: string) {
  const { error } = await supabase
    .from('oiac_popups')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// Settings table (key-value store for site-wide settings)
export async function getSetting(key: string): Promise<unknown | null> {
  const { data, error } = await supabase
    .from('oiac_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error) throw error;
  return data?.value ?? null;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const { error } = await supabase
    .from('oiac_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

  if (error) throw error;
}

// Featured Posters table (homepage featured poster grid)
export type FeaturedPosterInput = {
  title: string;
  imageUrl: string;
  linkUrl?: string;
  link1Text?: string;
  link1Url?: string;
  link2Text?: string;
  link2Url?: string;
  displayOrder?: number;
};

export type FeaturedPosterRecord = FeaturedPosterInput & {
  id: string;
  created_at: string;
  updated_at: string;
};

function mapFeaturedPosterRecord(record: Record<string, any>): FeaturedPosterRecord {
  return {
    id: record.id,
    title: record.title,
    imageUrl: record.image_url,
    linkUrl: record.link_url,
    link1Text: record.link1_text,
    link1Url: record.link1_url,
    link2Text: record.link2_text,
    link2Url: record.link2_url,
    displayOrder: record.display_order,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

export async function createFeaturedPoster(data: FeaturedPosterInput): Promise<FeaturedPosterRecord[]> {
  const { data: result, error } = await supabase
    .from('oiac_featured_posters')
    .insert([{
      title: data.title,
      image_url: data.imageUrl,
      link_url: data.linkUrl || null,
      link1_text: data.link1Text || null,
      link1_url: data.link1Url || null,
      link2_text: data.link2Text || null,
      link2_url: data.link2Url || null,
      display_order: data.displayOrder || null,
    }])
    .select();

  if (error) throw error;
  return (result || []).map(mapFeaturedPosterRecord);
}

export async function getFeaturedPosters(): Promise<FeaturedPosterRecord[]> {
  const { data, error } = await supabase
    .from('oiac_featured_posters')
    .select('*')
    .order('display_order', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data || []).map(mapFeaturedPosterRecord);
}

export async function getFeaturedPosterById(id: string): Promise<FeaturedPosterRecord | null> {
  const { data, error } = await supabase
    .from('oiac_featured_posters')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return mapFeaturedPosterRecord(data);
}

export async function updateFeaturedPoster(id: string, data: Partial<FeaturedPosterInput>) {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
  if (data.linkUrl !== undefined) updateData.link_url = data.linkUrl;
  if (data.link1Text !== undefined) updateData.link1_text = data.link1Text;
  if (data.link1Url !== undefined) updateData.link1_url = data.link1Url;
  if (data.link2Text !== undefined) updateData.link2_text = data.link2Text;
  if (data.link2Url !== undefined) updateData.link2_url = data.link2Url;
  if (data.displayOrder !== undefined) updateData.display_order = data.displayOrder;

  const { data: result, error } = await supabase
    .from('oiac_featured_posters')
    .update(updateData)
    .eq('id', id)
    .select();

  if (error) throw error;
  return result;
}

export async function deleteFeaturedPoster(id: string) {
  const { error } = await supabase
    .from('oiac_featured_posters')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function shiftFeaturedPosterOrders(): Promise<void> {
  const { data, error } = await supabase
    .from('oiac_featured_posters')
    .select('id, display_order');

  if (error) throw error;

  for (const poster of (data || [])) {
    await supabase
      .from('oiac_featured_posters')
      .update({ display_order: (poster.display_order || 0) + 1 })
      .eq('id', poster.id);
  }
}

// Hero Templates table
export type HeroTemplateInput = {
  title: string;
  badge: string;
  subtitle?: string;
  backgroundType: 'color' | 'image';
  backgroundColor?: string; // Hex color or gradient CSS
  backgroundImageUrl?: string;
  videoUrl?: string; // YouTube, Streamable, or media library URL
  videoType?: 'youtube' | 'streamable' | 'other';
  ctaText: string;
  ctaLink: string; // Can be external URL or internal path like /donate
  isActive?: boolean;
  displayOrder?: number;
  fullWidth?: boolean; // If true, hero takes full width and carousel appears below
};

export type HeroTemplateRecord = HeroTemplateInput & {
  id: string;
  created_at: string;
  updated_at: string;
};

function mapHeroTemplateRecord(record: Record<string, any>): HeroTemplateRecord {
  return {
    id: record.id,
    title: record.title,
    badge: record.badge,
    subtitle: record.subtitle,
    backgroundType: record.background_type,
    backgroundColor: record.background_color,
    backgroundImageUrl: record.background_image_url,
    videoUrl: record.video_url,
    videoType: record.video_type,
    ctaText: record.cta_text,
    ctaLink: record.cta_link,
    isActive: record.is_active,
    displayOrder: record.display_order,
    fullWidth: record.full_width || false,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

export async function createHeroTemplate(data: HeroTemplateInput): Promise<HeroTemplateRecord[]> {
  const { data: result, error } = await supabase
    .from('hero_templates')
    .insert([{
      title: data.title,
      badge: data.badge,
      subtitle: data.subtitle || null,
      background_type: data.backgroundType,
      background_color: data.backgroundColor || null,
      background_image_url: data.backgroundImageUrl || null,
      video_url: data.videoUrl || null,
      video_type: data.videoType || null,
      cta_text: data.ctaText,
      cta_link: data.ctaLink,
      is_active: data.isActive || false,
      display_order: data.displayOrder || null,
      full_width: data.fullWidth || false,
    }])
    .select();

  if (error) throw error;
  return (result || []).map(mapHeroTemplateRecord);
}

export async function getHeroTemplates(): Promise<HeroTemplateRecord[]> {
  const { data, error } = await supabase
    .from('hero_templates')
    .select('*')
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapHeroTemplateRecord);
}

export async function getHeroTemplateById(id: string): Promise<HeroTemplateRecord | null> {
  const { data, error } = await supabase
    .from('hero_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapHeroTemplateRecord(data);
}

export async function getActiveHeroTemplate(): Promise<HeroTemplateRecord | null> {
  const { data, error } = await supabase
    .from('hero_templates')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return mapHeroTemplateRecord(data);
}

export async function updateHeroTemplate(id: string, data: Partial<HeroTemplateInput>) {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.badge !== undefined) updateData.badge = data.badge;
  if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
  if (data.backgroundType !== undefined) updateData.background_type = data.backgroundType;
  if (data.backgroundColor !== undefined) updateData.background_color = data.backgroundColor;
  if (data.backgroundImageUrl !== undefined) updateData.background_image_url = data.backgroundImageUrl;
  if (data.videoUrl !== undefined) updateData.video_url = data.videoUrl;
  if (data.videoType !== undefined) updateData.video_type = data.videoType;
  if (data.ctaText !== undefined) updateData.cta_text = data.ctaText;
  if (data.ctaLink !== undefined) updateData.cta_link = data.ctaLink;
  if (data.displayOrder !== undefined) updateData.display_order = data.displayOrder;
  if (data.fullWidth !== undefined) updateData.full_width = data.fullWidth;

  // Handle isActive: if setting to true, deactivate all others
  if (data.isActive === true) {
    const { error: deactivateError } = await supabase
      .from('hero_templates')
      .update({ is_active: false })
      .neq('id', id);

    if (deactivateError) throw deactivateError;
  }

  if (data.isActive !== undefined) updateData.is_active = data.isActive;

  const { data: result, error } = await supabase
    .from('hero_templates')
    .update(updateData)
    .eq('id', id)
    .select();

  if (error) throw error;
  return (result || []).map(mapHeroTemplateRecord);
}

export async function deleteHeroTemplate(id: string) {
  // Prevent deletion of active template
  const template = await getHeroTemplateById(id);
  if (template?.isActive) {
    throw new Error('Cannot delete active hero template. Please set another template as active first.');
  }

  const { error } = await supabase
    .from('hero_templates')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// Initialize database tables (run this once via Supabase SQL Editor)
// This function is not needed when using Supabase JS client
// Create tables directly in Supabase dashboard or SQL Editor
export async function initDatabase() {
  console.log('For Supabase, please create tables using the SQL Editor in your Supabase dashboard.');
  console.log('See MIGRATION_SUMMARY.md for the SQL commands.');
}
