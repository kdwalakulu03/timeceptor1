/**
 * Timeceptor — Multi-service planetary hour data.
 * Each planet has tailored descriptions for 7 different life domains.
 */

import { ServiceId, ServiceDefinition } from './types';

export interface ServiceHourData {
  activity: string;
  desc: string;
}

export const SERVICES: ServiceDefinition[] = [
  { id: 'yoga',       name: 'Yoga',              icon: '🧘', tagline: 'Asana & movement' },
  { id: 'meditation', name: 'Meditation',         icon: '🕯️', tagline: 'Stillness & inner work' },
  { id: 'business',   name: 'Business',           icon: '📈', tagline: 'Decisions & finance' },
  { id: 'creative',   name: 'Creative',           icon: '🎨', tagline: 'Art & expression' },
  { id: 'travel',     name: 'Travel',             icon: '✈️', tagline: 'Journeys & departures' },
  { id: 'love',       name: 'Love',               icon: '💛', tagline: 'Connection & romance' },
  { id: 'health',     name: 'Health',             icon: '🌿', tagline: 'Healing & wellness' },
  { id: 'social_media', name: 'Social Media Post', icon: '📱', tagline: 'Content & engagement timing' },
];

export const PLANET_SERVICE_DATA: Record<string, Record<ServiceId, ServiceHourData>> = {
  Sun: {
    yoga:       { activity: 'Dynamic yoga & Surya Namaskar',       desc: 'Solar energy peaks — ideal for dynamic morning flows and sun salutations. Your vitality is amplified.' },
    meditation: { activity: 'Solar visualization & Trataka',       desc: 'Sun hora sharpens willpower and single-pointed focus. Practice candle gazing (Trataka) or solar visualizations — intention set now carries the whole day.' },
    business:   { activity: 'Leadership decisions & announcements', desc: 'The Sun rules kings and executives. Ideal for presenting to leaders, bold decisions, public announcements, and founding new ventures.' },
    creative:   { activity: 'Bold self-expression & performance',  desc: 'Your creative light is brightest now. Perfect for performing, publishing, recording, or any artistic statement that reflects your identity.' },
    travel:     { activity: 'Auspicious departures & pilgrimage',  desc: 'Journeys begun under the Sun carry authority and purpose. Ideal for important business travel, pilgrimages, and official departures.' },
    love:       { activity: 'Bold declarations & rekindling',      desc: 'The Sun illuminates truth. Express your feelings boldly, rekindle faded connections, or make a proud and confident gesture of affection.' },
    health:     { activity: 'Energising treatments & sun therapy', desc: 'Solar hora boosts immunity and vitality. Excellent for energising treatments, morning sun exposure, building constitution, and revitalising the system.' },
    social_media: { activity: 'Announcement & authority posts', desc: 'Sun hora gives posts authority and gravitas. Ideal for brand announcements, leadership content, personal branding, and posts that need to command attention.' },
  },

  Moon: {
    yoga:       { activity: 'Yin, restorative & gentle flow',        desc: 'The Moon governs your body\'s fluid rhythms. Perfect for slow, restorative practice or bedtime stretching.' },
    meditation: { activity: 'Yoga nidra & lunar affirmations',       desc: 'Moon hora deepens emotional intuition. Best for Yoga Nidra, water element visualizations, dream journaling, and healing the subconscious mind.' },
    business:   { activity: 'Team nurturing & customer research',    desc: 'The Moon governs the public. Excellent for customer research, team empathy, intuitive business reading, and nurturing client relationships.' },
    creative:   { activity: 'Imaginative writing & music',           desc: 'Lunar energy unlocks imagination and emotional depth. Ideal for poetry, fiction writing, composing melancholic or dreamy music, and intuitive art.' },
    travel:     { activity: 'Short trips & water-adjacent journeys', desc: 'Moon hora suits coastal journeys, family travel, and intuitive exploration. Keep an open itinerary and follow what feels right.' },
    love:       { activity: 'Deep emotional bonding & intimacy',     desc: 'The Moon rules the heart and emotional tides. Perfect for heart-to-heart conversations, building emotional safety, and deepening intimacy.' },
    health:     { activity: 'Hydration & lymphatic support',         desc: 'Moon hora governs fluids and the lymphatic system. Excellent for deep hydration, lymphatic massage, emotional healing, and restorative sleep rituals.' },
    social_media: { activity: 'Emotional & relatable content', desc: 'Moon hora connects with the crowd emotionally. Perfect for heartfelt stories, vulnerability posts, nostalgia content, and audience engagement that builds a personal bond.' },
  },

  Mars: {
    yoga:       { activity: 'Power yoga, vinyasa & strength',       desc: 'Mars hora ignites physical fire. Harness this energy for challenging flows, inversions, and muscle building.' },
    meditation: { activity: 'Breath of fire & vigorous pranayama',  desc: 'Mars hora energizes forceful pranayama. Practice Kapalabhati, Bhastrika, or intense breath retention. Channel aggression into disciplined breath.' },
    business:   { activity: 'Negotiations & competitive launches',  desc: 'Mars is the planet of decisive action. This is your window to negotiate hard, launch boldly, pitch with conviction, and outmaneuver competition.' },
    creative:   { activity: 'Rapid prototyping & breaking blocks',  desc: 'Mars cuts through creative stagnation. Use this hour for furious first drafts, aggressive iteration, bold experimentation, and overcoming creative fear.' },
    travel:     { activity: 'Adventure trekking & expeditions',     desc: 'Ideal for physically demanding travel, trekking, adventure sports, and competitive expeditions where energy and courage are required.' },
    love:       { activity: 'Passion, fire & direct confrontation', desc: 'Mars rules desire and confrontation. Use this hour for passionate connection or addressing conflict head-on. Avoid passive-aggressive dynamics now.' },
    health:     { activity: 'High-intensity training & detox',      desc: 'Mars hora is prime for HIIT, strength training, surgery prep, detoxification, and clearing inflammation. Push hard — recovery follows.' },
    social_media: { activity: 'Provocative & viral content', desc: 'Mars hora fuels bold, provocative posts that cut through noise. Perfect for hot takes, call-to-action posts, competitive comparisons, and content designed to spark debate.' },
  },

  Mercury: {
    yoga:       { activity: 'Balance poses & mindful flow',         desc: 'Mercury brings coordination and mental clarity. Excellent for precision poses, tree pose, and breathwork.' },
    meditation: { activity: 'Mindfulness of thoughts & Japa',       desc: 'Mercury hora sharpens the discriminating mind. Excellent for mindfulness of thoughts, mantra repetition, breathwork with counting, and cognitive clarity.' },
    business:   { activity: 'Contracts, writing & networking',      desc: 'Mercury rules all communication. Perfect for drafting contracts, important emails, analytical calls, negotiating precision, and networking events.' },
    creative:   { activity: 'Writing, design & coding',             desc: 'Mercury hora is a gift for writers, designers, and developers. Your mind is quick and your words flow. Ideal for copywriting, editing, and detailed design.' },
    travel:     { activity: 'Short trips & communication travel',   desc: 'Mercury rules local transit and short distances. Perfect for day trips, commutes, cross-town meetings, and any travel involving exchange of information.' },
    love:       { activity: 'Deep conversation & love letters',     desc: 'Mercury connects minds. Use this hour for meaningful intellectual conversation, writing a heartfelt message, or bridging communication gaps.' },
    health:     { activity: 'Mental wellness & breathwork',         desc: 'Mercury hora supports the nervous system and mental clarity. Ideal for therapy, journaling, breathwork, coordination exercises, and managing anxiety.' },
    social_media: { activity: 'Informative & trending content', desc: 'Mercury hora is THE social media planet — communication, wit, trends. Perfect for trend-jacking, educational threads, stories, carousels, and quick-hit content.' },
  },

  Jupiter: {
    yoga:       { activity: 'Pranayama, meditation & heart yoga',   desc: 'The great benefic expands your breath and spirit. Ideal for pranayama, meditation, and heart-opening backbends.' },
    meditation: { activity: 'Transcendental & Japa meditation',     desc: 'Jupiter hora is the most auspicious for deep spiritual practice. Practice transcendental meditation, extended Japa, gratitude contemplation, and guru prayer.' },
    business:   { activity: 'Big-picture planning & fundraising',   desc: 'Jupiter rules expansion and abundance. This is the window for strategic planning, investor meetings, legal navigation, international business, and raising capital.' },
    creative:   { activity: 'Visionary work & storytelling',        desc: 'Jupiter hora opens the mind to great themes. Perfect for visionary writing, world-building, concept development, and work that aspires to inspire.' },
    travel:     { activity: 'Long-distance & spiritual journeys',   desc: 'Jupiter rules long-distance journeys and foreign lands. Most auspicious for beginning international trips, spiritual pilgrimages, and learning journeys.' },
    love:       { activity: 'Commitment & deepening the bond',      desc: 'Jupiter blesses long-term unions. Ideal for commitment conversations, proposals, deepening trust, and discussing shared values and future growth.' },
    health:     { activity: 'Ayurvedic healing & liver support',    desc: 'Jupiter governs the liver and fat metabolism. Excellent for Ayurvedic treatments, liver-cleansing protocols, and holistic wellness sessions.' },
    social_media: { activity: 'Thought leadership & growth content', desc: 'Jupiter hora amplifies wisdom-based content. Ideal for long-form thought leadership, educational content, motivational posts, and content that positions you as an authority.' },
  },

  Venus: {
    yoga:       { activity: 'Slow flow, hip openers & heart poses', desc: 'Venus brings grace and ease to the body. Beautiful for slow, aesthetic flows, hip openers, and floor poses.' },
    meditation: { activity: 'Loving-kindness (Metta) meditation',   desc: 'Venus hora softens the heart. Perfect for Metta (loving-kindness) meditation, heart chakra visualization, beauty contemplation, and devotional practice.' },
    business:   { activity: 'Partnerships, branding & client care', desc: 'Venus governs beauty and alliances. Excellent for partnership deals, brand strategy sessions, client relationship building, and creative business development.' },
    creative:   { activity: 'Aesthetic refinement & visual art',    desc: 'Venus hora is the most exquisite for beauty-driven work — visual art, photography, music, fashion, interior design, and all aesthetic refinement.' },
    travel:     { activity: 'Leisure, romance & cultural tourism',  desc: 'Venus rules pleasure and beauty. Ideal for honeymoons, romantic getaways, cultural travel, art tourism, luxury experiences, and journeys for enjoyment.' },
    love:       { activity: 'Romance, dates & gift-giving',         desc: 'Venus hora is the most powerful for love. Plan your date, give a meaningful gift, create a beautiful atmosphere, and let pleasure lead the connection.' },
    health:     { activity: 'Beauty treatments & sensory healing',  desc: 'Venus hora is ideal for skincare, facials, spa sessions, sensory healing, and all practices that beautify and restore the body\'s natural elegance.' },
    social_media: { activity: 'Aesthetic & lifestyle content', desc: 'Venus hora is peak time for beautiful visual content — lifestyle shots, aesthetic reels, fashion, food photography, and any post where beauty and appeal drive engagement.' },
  },

  Saturn: {
    yoga:       { activity: 'Rest, walk or skip practice',          desc: 'Saturn constricts energy — the body resists effort. Best to rest, take a gentle walk, or do simple stretching only.' },
    meditation: { activity: 'Vipassana & structured sitting',       desc: 'Saturn rewards discipline without expectation. Practice Vipassana-style neutral observation or simply maintaining your daily meditation streak.' },
    business:   { activity: 'Admin, audits & compliance work',      desc: 'Saturn rules structure and obligation. Use this window for administrative work, financial audits, compliance filing, and long-term structural planning.' },
    creative:   { activity: 'Editing, revision & structural work',  desc: 'Saturn is the great editor. Use this time for revision, cutting what doesn\'t serve, structural rewrites, and the unglamorous but essential polishing.' },
    travel:     { activity: 'Avoid departures — admin travel only', desc: 'Saturn creates delays and obstacles for new journeys. If you must travel, keep it local and administrative. Avoid beginning important trips in this window.' },
    love:       { activity: 'Honest review & practical care',       desc: 'Saturn cools emotion but deepens long-term commitment. Use this time for honest relationship review, practical acts of care, and future-focused conversation.' },
    health:     { activity: 'Rest, bone care & Vata balancing',     desc: 'Saturn governs bones, teeth, and the nervous system. Ideal for dental care, bone-strengthening practices, rest, and Vata-pacifying Ayurvedic routines.' },
    social_media: { activity: 'Legacy & long-form documentary', desc: 'Saturn rewards patience. Only post evergreen, archival content — behind-the-scenes processes, long-form tutorials, or restructuring announcements. Avoid quick viral attempts.' },
  },
};
