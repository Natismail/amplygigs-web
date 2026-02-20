export const MUSICIAN_CATEGORIES = {
  "Singer": {
    icon: "🎤",
    description: "Vocal performances across various genres",
    subcategories: [
      "Pop Singer",
      "R&B Singer",
      "Gospel Singer",
      "Jazz Vocalist",
      "Opera Singer",
      "Choral Singer",
      "Backup Vocalist",
      "Session Vocalist",
      "Soul Singer",
      "Country Singer",
      "Rock Singer"
    ]
  },
  
  "Instrumentalist": {
    icon: "🎸",
    description: "Musicians who play instruments",
    subcategories: [
      // Strings
      "Acoustic Guitar",
      "Electric Guitar",
      "Bass Guitar",
      "Violin",
      "Viola",
      "Cello",
      "Double Bass",
      "Harp",
      "Ukulele",
      "Banjo",
      
      // Keyboards
      "Piano",
      "Keyboard",
      "Organ",
      "Synthesizer",
      "Accordion",
      
      // Brass
      "Trumpet",
      "Trombone",
      "French Horn",
      "Tuba",
      "Saxophone",
      "Clarinet",
      
      // Woodwinds
      "Flute",
      "Oboe",
      "Bassoon",
      
      // Percussion
      "Drums",
      "Percussion",
      "Talking Drum",
      "Djembe",
      "Bongos",
      "Congas",
      "Xylophone",
      "Marimba",
      "Vibraphone",
      
      // Traditional African
      "Shekere",
      "Gangan",
      "Bata Drums",
      "Kora"
    ]
  },
  
  "DJ": {
    icon: "🎧",
    description: "Disc Jockeys and electronic music performers",
    subcategories: [
      "Club DJ",
      "Mobile DJ",
      "Wedding DJ",
      "Radio DJ",
      "Turntablist",
      "Hip Hop DJ",
      "House DJ",
      "Afrobeats DJ",
      "Techno DJ",
      "EDM DJ"
    ]
  },
  
  "Producer": {
    icon: "🎛️",
    description: "Music production and audio engineering",
    subcategories: [
      "Music Producer",
      "Beat Maker",
      "Sound Engineer",
      "Mix Engineer",
      "Mastering Engineer",
      "Recording Engineer",
      "Live Sound Engineer"
    ]
  },
  
  "Band": {
    icon: "🎵",
    description: "Group performances and ensembles",
    subcategories: [
      "Full Band",
      "Jazz Band",
      "Wedding Band",
      "Corporate Band",
      "Afrobeat Band",
      "Highlife Band",
      "Gospel Band",
      "Cover Band",
      "Tribute Band",
      "Rock Band"
    ]
  },
  
  "MC/Host": {
    icon: "🎙️",
    description: "Event hosting and master of ceremonies",
    subcategories: [
      "Event MC",
      "Wedding MC",
      "Corporate MC",
      "Party Host",
      "Comedian MC",
      "Conference Host"
    ]
  },
  
  "Conductor/Director": {
    icon: "🎼",
    description: "Musical leadership and direction",
    subcategories: [
      "Orchestra Conductor",
      "Choir Director",
      "Band Director",
      "Music Director",
      "Worship Leader"
    ]
  },
  
  "Performer": {
    icon: "💃",
    description: "Performance art and dance",
    subcategories: [
      "Dancer",
      "Choreographer",
      "Acrobat",
      "Fire Dancer",
      "Traditional Dancer",
      "Contemporary Dancer",
      "Ballet Dancer"
    ]
  },
  
  "Songwriter": {
    icon: "✍️",
    description: "Composing and writing music",
    subcategories: [
      "Songwriter",
      "Composer",
      "Lyricist",
      "Arranger",
      "Film Composer"
    ]
  },
  
  "Other": {
    icon: "🎭",
    description: "Additional entertainment services",
    subcategories: [
      "Voice Over Artist",
      "Compere",
      "Hype Man",
      "Session Musician",
      "Music Teacher",
      "Sound Designer",
      "Beatboxer"
    ]
  }
};

// Helper functions
export const getAllCategories = () => Object.keys(MUSICIAN_CATEGORIES);

export const getSubcategories = (category) => {
  return MUSICIAN_CATEGORIES[category]?.subcategories || [];
};

export const getCategoryIcon = (category) => {
  return MUSICIAN_CATEGORIES[category]?.icon || "🎵";
};

export const getCategoryDescription = (category) => {
  return MUSICIAN_CATEGORIES[category]?.description || "";
};

export const searchCategories = (query) => {
  const results = [];
  const lowerQuery = query.toLowerCase();
  
  Object.entries(MUSICIAN_CATEGORIES).forEach(([category, data]) => {
    if (category.toLowerCase().includes(lowerQuery)) {
      results.push({ type: 'category', category, value: category });
    }
    
    data.subcategories.forEach(sub => {
      if (sub.toLowerCase().includes(lowerQuery)) {
        results.push({ type: 'subcategory', category, value: sub });
      }
    });
  });
  
  return results;
};

// Get primary category from categories array
export const getPrimaryCategory = (categories) => {
  return categories?.find(cat => cat.isPrimary) || categories?.[0] || null;
};

// Get all subcategories as flat array
export const getAllSubcategoriesFlat = (categories) => {
  if (!Array.isArray(categories)) return [];
  
  return categories.reduce((acc, cat) => {
    return [...acc, ...cat.subcategories];
  }, []);
};