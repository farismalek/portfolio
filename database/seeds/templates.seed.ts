import { Template, TemplateCategory } from '../../backend/src/modules/portfolios/entities/template.entity';
import { Connection } from 'typeorm';

export const seedTemplates = async (connection: Connection): Promise<void> => {
  const templateRepository = connection.getRepository(Template);

  // Check if templates already exist
  const templatesCount = await templateRepository.count();
  if (templatesCount > 0) {
    console.log('Templates already seeded, skipping...');
    return;
  }

  // Create template data
  const templates = [
    // Modern template
    {
      name: 'Modern Minimalist',
      description: 'A clean, modern design with ample white space and sleek typography.',
      category: TemplateCategory.MINIMAL,
      thumbnailUrl: '/assets/templates/modern-minimalist.jpg',
      structure: {
        layouts: {
          header: 'fixed',
          maxWidth: 1200,
          spacing: 'comfortable'
        }
      },
      defaultPages: [
        {
          title: 'Home',
          content: {
            components: [
              {
                id: 'header-1',
                componentId: 'header-simple',
                type: 'header',
                position: 0,
                data: {
                  title: 'Portfolio',
                  navigation: [
                    { label: 'Home', url: '#home' },
                    { label: 'About', url: '#about' },
                    { label: 'Projects', url: '#projects' },
                    { label: 'Contact', url: '#contact' }
                  ],
                  ctaText: 'Get in Touch',
                  ctaUrl: '#contact'
                }
              },
              {
                id: 'hero-1',
                componentId: 'hero-centered',
                type: 'hero',
                position: 1,
                data: {
                  title: 'Hi, I'm Sarah.I build amazing digital experiences.',
                  subtitle: 'I'm a product designer based in New York, specializing in UI/ UX design, brand strategy, and visual design.',
                  primaryButtonText: 'View My Work',
                primaryButtonUrl: '#projects',
                secondaryButtonText: 'Contact Me',
                secondaryButtonUrl: '#contact'
              }
              },
              {
          id: 'about-1',
          componentId: 'about-split',
          type: 'about',
          position: 2,
          data: {
            title: 'About Me',
            subtitle: 'Learn more about my background and expertise.',
            content: 'I'm a passionate designer with over 5 years of experience creating user- centered digital experiences.My approach combines strategic thinking with creative problem- solving to build products that people love to use.',
                  stats: [
          { value: '5+', label: 'Years Experience' },
          { value: '20+', label: 'Projects Completed' },
          { value: '15+', label: 'Happy Clients' }
        ]
                }
              }
            ]
          }
        },
{
  title: 'Projects',
    content: {
    components: [
      {
        id: 'header-2',
        componentId: 'header-simple',
        type: 'header',
        position: 0,
        data: {
          title: 'Portfolio',
          navigation: [
            { label: 'Home', url: '/' },
            { label: 'Projects', url: '/projects' },
            { label: 'Contact', url: '/contact' }
          ]
        }
      },
      {
        id: 'projects-1',
        componentId: 'projects-grid',
        type: 'projects',
        position: 1,
        data: {
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
        }
      }
    ]
  }
},
{
  title: 'Contact',
    content: {
    components: [
      {
        id: 'header-3',
        componentId: 'header-simple',
        type: 'header',
        position: 0,
        data: {
          title: 'Portfolio',
          navigation: [
            { label: 'Home', url: '/' },
            { label: 'Projects', url: '/projects' },
            { label: 'Contact', url: '/contact' }
          ]
        }
      },
      {
        id: 'contact-1',
        componentId: 'contact-split',
        type: 'contact',
        position: 1,
        data: {
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
        }
      }
    ]
  }
}
      ],
typography: {
  fontFamily: {
    heading: 'Inter, sans-serif',
      body: 'Inter, sans-serif'
  },
  fontSize: {
    base: '16px',
      scale: 1.25
  },
  fontWeight: {
    normal: 400,
      medium: 500,
        bold: 700
  }
},
colors: {
  primary: {
    50: '#f0f9ff',
      100: '#e0f2fe',
        500: '#0ea5e9',
          600: '#0284c7',
            700: '#0369a1'
  },
  neutral: {
    50: '#f8fafc',
      100: '#f1f5f9',
        200: '#e2e8f0',
          700: '#334155',
            800: '#1e293b',
              900: '#0f172a'
  }
},
isPremium: false,
  featured: true
    },

// Creative template
{
  name: 'Creative Studio',
    description: 'Bold, artistic design for creative professionals who want to stand out.',
      category: TemplateCategory.CREATIVE,
        thumbnailUrl: '/assets/templates/creative-studio.jpg',
          structure: {
    layouts: {
      header: 'absolute',
        maxWidth: 1440,
          spacing: 'expansive'
    }
  },
  defaultPages: [
    {
      title: 'Home',
      content: {
        components: [
          {
            id: 'hero-creative',
            componentId: 'hero-fullscreen',
            type: 'hero',
            position: 0,
            data: {
              title: 'Crafting Digital Experiences',
              subtitle: 'Designer & Illustrator based in Berlin',
              backgroundImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1950&q=80'
            }
          },
          {
            id: 'projects-creative',
            componentId: 'projects-masonry',
            type: 'projects',
            position: 1,
            data: {
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
            }
          }
        ]
      }
    }
  ],
    typography: {
    fontFamily: {
      heading: 'Clash Display, sans-serif',
        body: 'Satoshi, sans-serif'
    },
    fontSize: {
      base: '18px',
        scale: 1.5
    },
    fontWeight: {
      normal: 400,
        medium: 500,
          bold: 700
    }
  },
  colors: {
    primary: {
      50: '#fdf2f8',
        100: '#fce7f3',
          500: '#ec4899',
            600: '#db2777',
              700: '#be185d'
    },
    neutral: {
      50: '#fafafa',
        100: '#f5f5f5',
          200: '#e5e5e5',
            700: '#404040',
              800: '#262626',
                900: '#171717'
    }
  },
  isPremium: true,
    featured: true
},

// Professional template
{
  name: 'Professional Resume',
    description: 'Clean, corporate-friendly design ideal for job seekers and executives.',
      category: TemplateCategory.PROFESSIONAL,
        thumbnailUrl: '/assets/templates/professional-resume.jpg',
          structure: {
    layouts: {
      header: 'sticky',
        maxWidth: 1140,
          spacing: 'compact'
    }
  },
  defaultPages: [
    {
      title: 'Resume',
      content: {
        components: [
          {
            id: 'header-professional',
            componentId: 'header-minimal',
            type: 'header',
            position: 0,
            data: {
              title: 'John Smith',
              navigation: [
                { label: 'Resume', url: '/' },
                { label: 'Experience', url: '#experience' },
                { label: 'Skills', url: '#skills' },
                { label: 'Education', url: '#education' },
                { label: 'Contact', url: '#contact' }
              ]
            }
          },
          {
            id: 'about-professional',
            componentId: 'about-professional',
            type: 'about',
            position: 1,
            data: {
              title: 'Senior Product Manager',
              subtitle: 'Driving product strategy and execution for enterprise SaaS solutions',
              summary: 'Over 10 years of experience in product management and development, with a focus on enterprise software and user experience.',
              imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=634&q=80',
              location: 'San Francisco, CA',
              email: 'john.smith@example.com'
            }
          },
          {
            id: 'experience-professional',
            componentId: 'experience-timeline',
            type: 'experience',
            position: 2,
            data: {
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
            }
          }
        ]
      }
    }
  ],
    typography: {
    fontFamily: {
      heading: 'Source Sans Pro, sans-serif',
        body: 'Source Sans Pro, sans-serif'
    },
    fontSize: {
      base: '16px',
        scale: 1.2
    },
    fontWeight: {
      normal: 400,
        medium: 600,
          bold: 700
    }
  },
  colors: {
    primary: {
      50: '#eff6ff',
        100: '#dbeafe',
          500: '#3b82f6',
            600: '#2563eb',
              700: '#1d4ed8'
    },
    neutral: {
      50: '#f9fafb',
        100: '#f3f4f6',
          200: '#e5e7eb',
            700: '#374151',
              800: '#1f2937',
                900: '#111827'
    }
  },
  isPremium: false,
    featured: false
},

// Tech template
{
  name: 'Tech Developer',
    description: 'Modern, tech-focused template perfect for developers and engineers.',
      category: TemplateCategory.TECH,
        thumbnailUrl: '/assets/templates/tech-developer.jpg',
          structure: {
    layouts: {
      header: 'fixed',
        maxWidth: 1280,
          spacing: 'comfortable'
    }
  },
  defaultPages: [
    {
      title: 'Home',
      content: {
        components: [
          {
            id: 'header-tech',
            componentId: 'header-dark',
            type: 'header',
            position: 0,
            data: {
              title: 'Dev Portfolio',
              navigation: [
                { label: 'Home', url: '/' },
                { label: 'Projects', url: '#projects' },
                { label: 'Skills', url: '#skills' },
                { label: 'GitHub', url: 'https://github.com/' }
              ]
            }
          },
          {
            id: 'hero-tech',
            componentId: 'hero-coder',
            type: 'hero',
            position: 1,
            data: {
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
            }
          }
        ]
      }
    }
  ],
    typography: {
    fontFamily: {
      heading: 'JetBrains Mono, monospace',
        body: 'Inter, sans-serif'
    },
    fontSize: {
      base: '16px',
        scale: 1.33
    },
    fontWeight: {
      normal: 400,
        medium: 500,
          bold: 700
    }
  },
  colors: {
    primary: {
      50: '#f0fdfa',
        100: '#ccfbf1',
          500: '#14b8a6',
            600: '#0d9488',
              700: '#0f766e'
    },
    neutral: {
      50: '#f8fafc',
        100: '#f1f5f9',
          200: '#e2e8f0',
            700: '#334155',
              800: '#1e293b',
                900: '#0f172a'
    }
  },
  isPremium: false,
    featured: true
}
  ];

// Save templates to database
for (const template of templates) {
  const newTemplate = templateRepository.create(template);
  await templateRepository.save(newTemplate);
}

console.log(`Seeded ${templates.length} templates`);
};