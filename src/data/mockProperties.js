export const MOCK_PROPERTIES = [
  {
    id: 'prop-1',
    title: 'Modern Luxury Villa',
    price: 1250000,
    status: 'For Sale',
    location: 'Beverly Hills, CA',
    type: 'Villas',
    beds: 4,
    baths: 3,
    sqft: 3500,
    description: 'Welcome to this stunning modern luxury villa located in the heart of Beverly Hills. This architectural masterpiece features an open floor plan, floor-to-ceiling windows, and breathtaking views of the city skyline.',
    images: [
      'https://images.unsplash.com/photo-1600607686527-6fb886090705?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ],
    agentId: 'agent-1',
    featured: true
  },
  {
    id: 'prop-2',
    title: 'Skyline Penthouse Apartment',
    price: 4200,
    status: 'For Rent',
    location: 'New York, NY',
    type: 'Apartments',
    beds: 3,
    baths: 2,
    sqft: 2100,
    description: 'Luxurious penthouse apartment in Downtown Manhattan. Enjoy panoramic views, a private rooftop terrace, and state-of-the-art amenities.',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ],
    agentId: 'agent-2',
    featured: true
  },
  {
    id: 'prop-3',
    title: 'Suburban Family Home',
    price: 850000,
    status: 'For Sale',
    location: 'Austin, TX',
    type: 'Houses',
    beds: 4,
    baths: 2.5,
    sqft: 2800,
    description: 'Spacious family home located in a quiet suburban neighborhood. Features a large backyard, updated kitchen, and cozy fireplace.',
    images: [
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ],
    agentId: 'agent-1',
    featured: true
  },
  {
    id: 'prop-4',
    title: 'Modern Waterfront Estate',
    price: 1450000,
    status: 'For Sale',
    location: 'Miami, FL',
    type: 'Villas',
    beds: 5,
    baths: 4,
    sqft: 4200,
    description: 'Breathtaking waterfront estate with private dock, infinity edge pool, and modern minimalist interiors.',
    images: [
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1501183638710-841dd1904471?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ],
    agentId: 'agent-2',
    featured: false
  },
  {
    id: 'prop-5',
    title: 'Chic Minimalist Studio',
    price: 2800,
    status: 'For Rent',
    location: 'Los Angeles, CA',
    type: 'Apartments',
    beds: 1,
    baths: 1,
    sqft: 900,
    description: 'Perfect for artists and professionals. This chic studio is located in the vibrant Arts District.',
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1493809842364-78817add7ff6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ],
    agentId: 'agent-1',
    featured: false
  },
  {
    id: 'prop-6',
    title: 'Cozy Countryside Cottage',
    price: 590000,
    status: 'For Sale',
    location: 'Austin, TX',
    type: 'Houses',
    beds: 3,
    baths: 2,
    sqft: 1800,
    description: 'Escape the city to this cozy cottage. Surrounded by nature, it offers a peaceful retreat with modern comforts.',
    images: [
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb65?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ],
    agentId: 'agent-2',
    featured: false
  }
];

export const MOCK_AGENTS = [
  {
    id: 'agent-1',
    name: 'James Carter',
    role: 'Senior Property Consultant',
    phone: '+1 (555) 123-4567',
    email: 'james@propertyexpress.com',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'agent-2',
    name: 'Sarah Jenkins',
    role: 'Luxury Real Estate Specialist',
    phone: '+1 (555) 987-6543',
    email: 'sarah@propertyexpress.com',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80'
  }
];
