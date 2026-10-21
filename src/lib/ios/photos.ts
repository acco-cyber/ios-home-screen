export interface Photo {
  id: string
  src: string
  title: string
  place: string
  date: string
}

export const PHOTOS: Photo[] = [
  { id: 'p1', src: '/photos/beach.jpg', title: 'Turquoise Cove', place: 'Maldives', date: 'August 14' },
  { id: 'p2', src: '/photos/city.jpg', title: 'Neon Streets', place: 'Tokyo', date: 'March 2' },
  { id: 'p3', src: '/photos/dog.jpg', title: 'Zoomies', place: 'Central Park', date: 'June 9' },
  { id: 'p4', src: '/photos/coffee.jpg', title: 'Slow Morning', place: 'Home', date: 'October 1' },
  { id: 'p5', src: '/photos/blossom.jpg', title: 'Sakura Season', place: 'Kyoto', date: 'April 5' },
  { id: 'p6', src: '/photos/fields.jpg', title: 'Terraces at Dawn', place: 'Sapa', date: 'September 21' },
  { id: 'p7', src: '/photos/balloons.jpg', title: 'Up & Away', place: 'Cappadocia', date: 'May 18' },
  { id: 'p8', src: '/photos/aurora.jpg', title: 'Sky on Fire', place: 'Tromsø', date: 'January 27' },
]
