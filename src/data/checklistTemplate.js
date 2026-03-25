export const CHECKLIST_SECTIONS = [
  {
    id: 'process_overview',
    title: 'Process Overview',
    items: [
      {
        id: '1.1',
        label: 'Description of the Process',
        description: 'Provide a detailed description of the process to be automated.\nWhat are the process\'s inputs, steps, and outputs? (attached working files)\nWhat is the current workflow? (e.g., step-by-step, decision tree)'
      },
      {
        id: '1.2',
        label: 'Automation Objectives',
        description: 'What are the client\'s goals for automating this process? (e.g., reduce processing time, improve accuracy, lower costs)'
      },
      {
        id: '1.3',
        label: 'Process Pain Points',
        description: 'What are the current challenges or inefficiencies in the process? (e.g., bottlenecks, errors, manual effort)'
      },
      {
        id: '1.4',
        label: 'Key Performance Indicators (KPIs)',
        description: 'How is the process\'s success currently measured?\nWhat metrics will be used to evaluate the AI agent\'s performance? (e.g., time saved per task, error rate reduction, cost savings)'
      },
      {
        id: '1.5',
        label: 'Process Volume and Frequency',
        description: 'How often is this process performed?\nWhat is the volume of transactions or tasks?\nAre there any seasonal variations or peak periods?'
      }
    ]
  },
  {
    id: 'data_requirements',
    title: 'Data Requirements',
    items: [
      {
        id: '2.1',
        label: 'Data Sources',
        description: 'Where does the data for this process come from? (e.g., databases, spreadsheets, documents, APIs)'
      },
      {
        id: '2.2',
        label: 'Data Format',
        description: 'What is the format of the data? (e.g., CSV, Excel, JSON, PDF, images)'
      },
      {
        id: '2.3',
        label: 'Data Accessibility',
        description: 'How can the AI agent access the data? (e.g., direct database access, API integration, file transfer)'
      },
      {
        id: '2.4',
        label: 'Data Quality',
        description: 'How accurate, complete, and consistent is the data?\nAre there any data cleaning or preprocessing requirements?'
      },
      {
        id: '2.5',
        label: 'Data Sensitivity and Security',
        description: 'Does the data contain any sensitive or confidential information?\nWhat are the client\'s data security and privacy requirements?\n(e.g., GDPR, HIPAA compliance)'
      },
      {
        id: '2.6',
        label: 'Data Retention Policy',
        description: 'What are the client\'s requirements for how long the data needs to be stored?'
      }
    ]
  },
  {
    id: 'agent_capabilities',
    title: 'Agent Capabilities',
    items: [
      {
        id: '3.1',
        label: 'Required Agent Functions',
        description: 'What tasks will the AI agent need to perform? (e.g., data extraction, decision-making, task execution, communication)'
      },
      {
        id: '3.2',
        label: 'Decision-Making Logic',
        description: 'How are decisions currently made in the process?\nCan this logic be expressed as rules, decision trees, or algorithms?\nAre there any exceptions or edge cases?'
      },
      {
        id: '3.3',
        label: 'Integration Requirements',
        description: 'With what systems or applications does the AI agent need to integrate? (e.g., CRM, ERP, databases, messaging platforms)'
      },
      {
        id: '3.4',
        label: 'Communication Requirements',
        description: 'How will the AI agent communicate with users or other systems? (e.g., email, chat, API)'
      },
      {
        id: '3.5',
        label: 'Error Handling and Exception Management',
        description: 'How should the AI agent handle errors or unexpected situations? Are there any specific error logging or notification requirements?'
      }
    ]
  },
  {
    id: 'user_interaction',
    title: 'User Interaction and Experience',
    items: [
      {
        id: '4.1',
        label: 'Target Users',
        description: 'Who will be using the AI agent? What are their roles, technical skills, and needs?'
      },
      {
        id: '4.2',
        label: 'User Interface (UI) Requirements',
        description: 'What are the requirements for the agent\'s user interface (if any)? (e.g., web interface, mobile app, command-line interface)'
      }
    ]
  },
  {
    id: 'technical_requirements',
    title: 'Technical Requirements',
    items: [
      {
        id: '5.1',
        label: 'Deployment Environment',
        description: 'Where will the AI agent be deployed? (e.g., cloud, on-premises, specific servers)'
      },
      {
        id: '5.2',
        label: 'Scalability and Performance',
        description: 'What are the requirements for scalability and performance? (e.g., response time, throughput, handling peak loads)'
      },
      {
        id: '5.3',
        label: 'Security Requirements',
        description: 'What security measures need to be in place for the AI agent? (e.g., access control, encryption, authentication)'
      },
      {
        id: '5.4',
        label: 'Maintenance and Support',
        description: 'What are the client\'s requirements for ongoing maintenance and support?'
      },
      {
        id: '5.5',
        label: 'Dependencies',
        description: 'Are there any dependencies that could affect the project? (e.g., availability of data, integration with other systems)'
      }
    ]
  }
];
