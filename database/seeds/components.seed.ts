import { Component, ComponentCategory } from '../../backend/src/modules/portfolios/entities/component.entity';
import { Connection } from 'typeorm';

export const seedComponents = async (connection: Connection): Promise<void> => {
  const componentRepository = connection.getRepository(Component);

  // Check if components already exist
  const componentsCount = await componentRepository.count();
  if (componentsCount > 0) {
    console.log('Components already seeded, skipping...');
    return;
  }

  // Create component data
  const components = [
    // Header components
    {
      name: 'Simple Header',
      category: ComponentCategory.HEADER,
      type: 'header',
      schema: {
        properties: {
          title: { type: 'string', title: 'Title' },
          navigation: {
            type: 'array',
            title: 'Navigation Links',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                url: { type: 'string' }
              }
            }
          },
          ctaText: { type: 'string', title: 'CTA Text' },
          ctaUrl: { type: 'string', title: 'CTA URL' },
          logoUrl: { type: 'string', title: 'Logo URL' },
          transparent: { type: 'boolean', title: 'Transparent Background' }
        }
      },
      defaultData: {
        title: 'Portfolio',
        navigation: [
          { label: 'Home', url: '#home' },
          { label: 'About', url: '#about' },
          { label: 'Projects', url: '#projects' },
          { label: 'Contact', url: '#contact' }
        ],
        ctaText: 'Contact Me',
        ctaUrl: '#contact',
        transparent: false
      },
      thumbnailUrl: '/assets/components/header-simple.png',
      isPremium: false
    },
    {
      name: 'Minimal Header',
      category: ComponentCategory.HEADER,
      type: 'header',
      schema: {
        properties: {
          title: { type: 'string', title: 'Title' },
          navigation: {
            type: 'array',
            title: 'Navigation Links',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                url: { type: 'string' }
              }
            }
          }
        }
      },
      defaultData: {
        title: 'John Smith',
        navigation: [
          { label: 'Resume', url: '/' },
          { label: 'Experience', url: '#experience' },
          { label: 'Skills', url: '#skills' },
          { label: 'Contact', url: '#contact' }
        ]
      },
      thumbnailUrl: '/assets/components/header-minimal.png',
      isPremium: false
    },
    {
      name: 'Dark Header',
      category: ComponentCategory.HEADER,
      type: 'header',
      schema: {
        properties: {
          title: { type: 'string', title: 'Title' },
          navigation: {
            type: 'array',
            title: 'Navigation Links',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                url: { type: 'string' }
              }
            }
          }
        }
      },
      defaultData: {
        title: 'Dev Portfolio',
        navigation: [
          { label: 'Home', url: '/' },
          { label: 'Projects', url: '#projects' },
          { label: 'Skills', url: '#skills' },
          { label: 'GitHub', url: 'https://github.com/' }
        ]
      },
      thumbnailUrl: '/assets/components/header-dark.png',
      isPremium: false
    },

    // Hero components
    {
      name: 'Centered Hero',
      category: ComponentCategory.HERO,
      type: 'hero',
      schema: {
        properties: {
          title: { type: 'string', title: 'Title' },
          subtitle: { type: 'string', title: 'Subtitle' },
          primaryButtonText: { type: 'string', title: 'Primary Button Text' },
          primaryButtonUrl: { type: 'string', title: 'Primary Button URL' },
          secondaryButtonText: { type: 'string', title: 'Secondary Button Text' },
          secondaryButtonUrl: { type: 'string', title: 'Secondary Button URL' },
          backgroundImageUrl: { type: 'string', title: 'Background Image URL' }
        }
      },
      defaultData: {
        title: 'Hi, I'm Sarah.I build amazing digital experiences.',
        subtitle: 'I'm a product designer based in New York, specializing in UI/ UX design, brand strategy, and visual design.',
        primaryButtonText: 'View My Work',
      primaryButtonUrl: '#projects',
      secondaryButtonText: 'Contact Me',
      secondaryButtonUrl: '#contact'
    },
    thumbnailUrl: '/assets/components/hero-centered.png',
    isPremium: false
    },
  {
    name: 'Split Hero',
    category: ComponentCategory.HERO,
    type: 'hero',
    schema: {
      properties: {
        title: { type: 'string', title: 'Title' },
        subtitle: { type: 'string', title: 'Subtitle' },
        primaryButtonText: { type: 'string', title: 'Primary Button Text' },
        primaryButtonUrl: { type: 'string', title: 'Primary Button URL' },
        secondaryButtonText: { type: 'string', title: 'Secondary Button Text' },
        secondaryButtonUrl: { type: 'string', title: 'Secondary Button URL' },
        imageUrl: { type: 'string', title: 'Image URL' },
        imagePosition: {
          type: 'string',
          title: 'Image Position',
          enum: ['left', 'right']
        }
      }
    },
    defaultData: {
      title: 'Hi, I'm Sarah.I build amazing digital experiences.',
        subtitle: 'I'm a product designer based in New York, specializing in UI/UX design, brand strategy, and visual design.',
primaryButtonText: 'View My Work',
  primaryButtonUrl: '#projects',
    secondaryButtonText: 'Contact Me',
      secondaryButtonUrl: '#contact',
        imageUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
          imagePosition: 'right'
      },
thumbnailUrl: '/assets/components/hero-split.png',
  isPremium: false
    },
{
  name: 'Fullscreen Hero',
    category: ComponentCategory.HERO,
      type: 'hero',
        schema: {
    properties: {
      title: { type: 'string', title: 'Title' },
      subtitle: { type: 'string', title: 'Subtitle' },
      backgroundImageUrl: { type: 'string', title: 'Background Image URL' },
      overlayOpacity: { type: 'number', title: 'Overlay Opacity', minimum: 0, maximum: 1 }
    }
  },
  defaultData: {
    title: 'Crafting Digital Experiences',
      subtitle: 'Designer & Illustrator based in Berlin',
        backgroundImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1950&q=80',
          overlayOpacity: 0.5
  },
  thumbnailUrl: '/assets/components/hero-fullscreen.png',
    isPremium: true
},
{
  name: 'Coder Hero',
    category: ComponentCategory.HERO,
      type: 'hero',
        schema: {
    properties: {
      title: { type: 'string', title: 'Title' },
      subtitle: { type: 'string', title: 'Subtitle' },
      description: { type: 'string', title: 'Description' },
      codeSnippet: { type: 'string', title: 'Code Snippet' }
    }
  },
  defaultData: {
    title: '> Hello World_',
      subtitle: 'I build things for the web and mobile devices',
        description: 'Full-stack developer specializing in React, Node.js, and cloud infrastructure',
          codeSnippet: `
function HelloWorld() {
  return (
    <div className="greeting">
      <h1>Hello, I'm Alex</h1>
      <p>Let's build something amazing together</p>
    </div>
  );
}
        `
  },
  thumbnailUrl: '/assets/components/hero-coder.png',
    isPremium: false
},

// About components
{
  name: 'Split About',
    category: ComponentCategory.ABOUT,
      type: 'about',
        schema: {
    properties: {
      title: { type: 'string', title: 'Title' },
      subtitle: { type: 'string', title: 'Subtitle' },
      content: { type: 'string', title: 'Content' },
      imageUrl: { type: 'string', title: 'Image URL' },
      stats: {
        type: 'array',
          title: 'Statistics',
            items: {
          type: 'object',
            properties: {
            value: { type: 'string' },
            label: { type: 'string' }
          }
        }
      }
    }
  },
  defaultData: {
    title: 'About Me',
      subtitle: 'Get to know more about my background and expertise.',
        content: 'I'm a passionate designer with over 5 years of experience creating user - centered digital experiences.My approach combines strategic thinking with creative problem - solving to build products that people love to use.',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=634&q=80',
      stats: [
        { value: '5+', label: 'Years Experience' },
        { value: '20+', label: 'Projects Completed' },
        { value: '15+', label: 'Happy Clients' }
      ]
  },
  thumbnailUrl: '/assets/components/about-split.png',
    isPremium: false
},
{
  name: 'Professional About',
    category: ComponentCategory.ABOUT,
      type: 'about',
        schema: {
    properties: {
      title: { type: 'string', title: 'Title' },
      subtitle: { type: 'string', title: 'Subtitle' },
      summary: { type: 'string', title: 'Summary' },
      imageUrl: { type: 'string', title: 'Image URL' },
      location: { type: 'string', title: 'Location' },
      email: { type: 'string', title: 'Email' }
    }
  },
  defaultData: {
    title: 'Senior Product Manager',
      subtitle: 'Driving product strategy and execution for enterprise SaaS solutions',
        summary: 'Over 10 years of experience in product management and development, with a focus on enterprise software and user experience.',
          imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=634&q=80',
            location: 'San Francisco, CA',
              email: 'john.smith@example.com'
  },
  thumbnailUrl: '/assets/components/about-professional.png',
    isPremium: false
},

// Projects components
{
  name: 'Projects Grid',
    category: ComponentCategory.PROJECTS,
      type: 'projects',
        schema: {
    properties: {
      title: { type: 'string', title: 'Title' },
      subtitle: { type: 'string', title: 'Subtitle' },
      projects: {
        type: 'array',
          title: 'Projects',
            items: {
          type: 'object',
            properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            imageUrl: { type: 'string' },
            tags: {
              type: 'array',
                items: { type: 'string' }
            }
          }
        }
      }
    }
  },
  defaultData: {
    title: 'My Projects',
      subtitle: 'Check out some of my recent work',
        projects: [
          {
            title: 'Mobile App Design',
            description: 'UI/UX design for a fitness tracking application',
            imageUrl: 'https://images.unsplash.com/photo-1586880244406-556ebe35f282?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80',
            tags: ['UI/UX', 'Mobile', 'Fitness']
          },
          {
            title: 'E-commerce Website',
            description: 'Complete redesign of an online fashion store',
            imageUrl: 'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80',
            tags: ['Web Design', 'E-commerce', 'Fashion']
          },
          {
            title: 'Brand Identity',
            description: 'Logo and brand identity for a tech startup',
            imageUrl: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80',
            tags: ['Branding', 'Logo Design', 'Identity']
          }
        ]
  },
  thumbnailUrl: '/assets/components/projects-grid.png',
    isPremium: false
},
{
  name: 'Projects Masonry',
    category: ComponentCategory.PROJECTS,
      type: 'projects',
        schema: {
    properties: {
      title: { type: 'string', title: 'Title' },
      projects: {
        type: 'array',
          title: 'Projects',
            items: {
          type: 'object',
            properties: {
            title: { type: 'string' },
            imageUrl: { type: 'string' },
            year: { type: 'string' }
          }
        }
      }
    }
  },
  defaultData: {
    title: 'Selected Works',
      projects: [
        {
          title: 'Vibrant Poster Series',
          imageUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
          year: '2024'
        },
        {
          title: 'Brand Identity: Lumina',
          imageUrl: 'https://images.unsplash.com/photo-1638613067237-b1127ef06c00?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1172&q=80',
          year: '2023'
        },
        {
          title: 'Editorial Design',
          imageUrl: 'https://images.unsplash.com/photo-1595422656253-42dbdad481a0?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
          year: '2023'
        }
      ]
  },
  thumbnailUrl: '/assets/components/projects-masonry.png',
    isPremium: true
},

// Experience components
{
  name: 'Experience Timeline',
    category: ComponentCategory.EXPERIENCE,
      type: 'experience',
        schema: {
    properties: {
      title: { type: 'string', title: 'Title' },
      experiences: {
        type: 'array',
          title: 'Experiences',
            items: {
          type: 'object',
            properties: {
            title: { type: 'string' },
            company: { type: 'string' },
            location: { type: 'string' },
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            description: { type: 'string' }
          }
        }
      }
    }
  },
  defaultData: {
    title: 'Professional Experience',
      experiences: [
        {
          title: 'Senior Product Manager',
          company: 'TechCorp Inc.',
          location: 'San Francisco, CA',
          startDate: 'Jan 2021',
          endDate: 'Present',
          description: 'Leading product strategy and roadmap development for enterprise SaaS platform. Increased user engagement by 35% and reduced churn by 25%.'
        },
        {
          title: 'Product Manager',
          company: 'Innovation Labs',
          location: 'Seattle, WA',
          startDate: 'Mar 2018',
          endDate: 'Dec 2020',
          description: 'Managed the complete product lifecycle from conceptualization to launch for mobile applications, resulting in 2M+ downloads.'
        },
        {
          title: 'Product Analyst',
          company: 'DataTech Solutions',
          location: 'Austin, TX',
          startDate: 'Jun 2016',
          endDate: 'Feb 2018',
          description: 'Conducted market research and competitive analysis to inform product decisions. Developed KPI frameworks for measuring product success.'
        }
      ]
  },
  thumbnailUrl: '/assets/components/experience-timeline.png',
    isPremium: false
},

// Skills components
{
  name: 'Skills Grid',
    category: ComponentCategory.SKILLS,
      type: 'skills',
        schema: {
    properties: {
      title: { type: 'string', title: 'Title' },
      subtitle: { type: 'string', title: 'Subtitle' },
      skills: {
        type: 'array',
          title: 'Skills',
            items: {
          type: 'object',
            properties: {
            name: { type: 'string' },
            level: { type: 'number', minimum: 0, maximum: 100 },
            icon: { type: 'string', nullable: true }
          }
        }
      }
    }
  },
  defaultData: {
    title: 'My Skills',
      subtitle: 'Technologies and tools I work with',
        skills: [
          { name: 'UI/UX Design', level: 90, icon: 'figma' },
          { name: 'HTML/CSS', level: 85, icon: 'html5' },
          { name: 'JavaScript', level: 80, icon: 'javascript' },
          { name: 'React', level: 75, icon: 'react' },
          { name: 'Node.js', level: 70, icon: 'nodejs' },
          { name: 'GraphQL', level: 65, icon: 'graphql' }
        ]
  },
  thumbnailUrl: '/assets/components/skills-grid.png',
    isPremium: false
},

// Contact components
{
  name: 'Contact Split',
    category: ComponentCategory.CONTACT,
      type: 'contact',
        schema: {
    properties: {
      title: { type: 'string', title: 'Title' },
      subtitle: { type: 'string', title: 'Subtitle' },
      email: { type: 'string', title: 'Email' },
      phone: { type: 'string', title: 'Phone' },
      location: { type: 'string', title: 'Location' },
      socialLinks: {
        type: 'array',
          title: 'Social Links',
            items: {
          type: 'object',
            properties: {
            platform: { type: 'string' },
            url: { type: 'string' }
          }
        }
      }
    }
  },
  defaultData: {
    title: 'Get in Touch',
      subtitle: 'Have a project in mind? Let's talk about it.',
    email: 'hello@example.com',
      phone: '+1 (555) 123-4567',
        location: 'New York, NY',
          socialLinks: [
            { platform: 'Twitter', url: 'https://twitter.com/' },
            { platform: 'LinkedIn', url: 'https://linkedin.com/in/' },
            { platform: 'Dribbble', url: 'https://dribbble.com/' }
          ]
  },
  thumbnailUrl: '/assets/components/contact-split.png',
    isPremium: false
}
  ];

// Save components to database
for (const component of components) {
  const newComponent = componentRepository.create(component);
  await componentRepository.save(newComponent);
}

console.log(`Seeded ${components.length} components`);
};