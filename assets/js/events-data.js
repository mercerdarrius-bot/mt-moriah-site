/* Single source of truth for church events. The homepage calendar and the
   events page both read this list, so a new event only has to be added once.
   `date` is the event day in YYYY-MM-DD; `endDate` is optional for multi-day
   events. Everything sorts and filters off those dates, so an event drops off
   the site on its own once its date has passed. */

window.MM_EVENTS = [
  {
    slug: 'back-to-school',
    title: 'Back to School Giveaway',
    ministry: 'NexGen Youth Department',
    tagline: 'Equipping our youth for a brighter tomorrow',
    date: '2026-08-02',
    dateLabel: 'Sunday, August 2',
    timeLabel: 'Immediately after church service',
    venue: 'Mount Moriah Missionary Baptist Church',
    address: '902 E Alabama St, Plant City, FL 33563',
    flyer: 'assets/img/events/back-to-school.jpg',
    flyerSize: [1400, 934],
    body: [
      'Our NexGen Youth Department is sending our students back to school ready and encouraged. Join us right after morning worship as we bless our young people with the supplies they need for the year ahead.',
      'Every student is welcome. Bring your children, bring your neighbors, and let us surround this generation with support as they begin a new school year.'
    ],
    details: [
      { label: 'Who', value: 'All students, from elementary through high school' },
      { label: 'Cost', value: 'Free' }
    ]
  },
  {
    slug: 'preaching-in-the-park',
    title: 'Preaching in the Park',
    ministry: 'Churchwide Fellowship',
    status: 'Postponed',
    tagline: 'Two churches. One fellowship. One Spirit.',
    date: '2026-08-23',
    dateLabel: 'Sunday, August 23',
    timeLabel: '11:00 AM',
    venue: 'Promenade Park, WaterGrass Community',
    address: '33743 Old Bridge Rd, Wesley Chapel, FL 33545',
    flyer: 'assets/img/events/preaching-in-the-park.jpg',
    flyerSize: [1400, 934],
    body: [
      'This event has been postponed. A new date will be announced soon, so watch this page and our social media for the update.',
      'Mount Moriah MBC of Plant City and St. John MBC of Dade City are coming together for a powerful outdoor worship experience as two sister churches unite in love and praise.',
      'Pastor Montgomery and Pastor Butler will both share the Word. Bring your portable chairs and come fellowship with us.'
    ],
    details: [
      { label: 'Preaching', value: 'Pastor Montgomery and Pastor Butler' },
      { label: 'Also happening', value: 'Pool, games, and line dancing' },
      { label: 'Bring', value: 'Portable chairs' }
    ]
  },
  {
    slug: 'self-care-saturday',
    title: 'Self Care Saturday 2026',
    ministry: 'Women of the Word',
    tagline: 'Find your people, with a loving perspective',
    date: '2026-09-26',
    dateLabel: 'Saturday, September 26',
    timeLabel: '12:00 PM to 3:00 PM, doors open at 11:00 AM',
    venue: 'Mount Moriah Missionary Baptist Church',
    address: '902 E Alabama St, Plant City, FL 33563',
    flyer: 'assets/img/events/self-care-saturday.jpg',
    flyerSize: [1400, 937],
    scripture: {
      text: 'Be devoted to one another in love. Honor one another above yourselves.',
      ref: 'Romans 12:10, NIV'
    },
    body: [
      'Women of the Word invites you to a day set apart for rest, encouragement, and sisterhood. Come connect, be encouraged, and leave refreshed.',
      'Lunch will be provided, along with food, fun, fellowship, and giveaways.'
    ],
    details: [
      { label: 'Tickets', value: '$40, available through September 13' },
      { label: 'Seating', value: 'Limited, capped at 150 people' },
      { label: 'Parking', value: 'Limited, carpooling encouraged' },
      { label: 'Members', value: 'Sell 5 or more tickets and receive a complimentary ticket' }
    ]
  }
];

/* Shared date helpers. Dates are parsed as local noon so a timezone offset can
   never roll an event onto the previous or next day. */
window.MM_EVENT_UTILS = {
  parse: function (ymd) {
    const p = ymd.split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2], 12, 0, 0);
  },
  today: function () {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 12, 0, 0);
  },
  upcoming: function () {
    const t = this.today();
    return window.MM_EVENTS
      .filter(e => this.parse(e.endDate || e.date) >= t)
      .sort((a, b) => this.parse(a.date) - this.parse(b.date));
  }
};
