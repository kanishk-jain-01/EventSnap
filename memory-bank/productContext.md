# Product Context: EventSnap - Event-Driven Networking Platform

## Problem Statement

Event attendees at conferences, festivals, and professional gatherings struggle to capture real-time moments and access contextual information (session schedules, exhibitor materials, sponsor content) within complex event environments. Existing social photo apps lack event-specific content expiration and AI-powered contextual search capabilities.

## User Experience Goals

### Core User Journey (EventSnap Platform)

1. **Event Onboarding**: Choose or create an event before accessing the main platform
2. **Content Creation**: Capture photos with optional text overlays and share to event feed
3. **AI Assistant Access**: Query event context ("When is this session?", "Show me the sponsor deck") with instant PDF/document responses
4. **Event Feed Browsing**: View event-scoped stories and snaps from other participants
5. **Role-Based Experience**: Host capabilities (content management, event settings) vs Guest experience (content consumption)
6. **Automatic Cleanup**: All content automatically expires 24 hours after event ends

### Design Principles

- **Event-Centric**: All functionality scoped to current event context
- **Professional Identity**: EventSnap branding for business/conference environments
- **Creative Light Theme**: Modern purple/pink color scheme with clean white backgrounds
- **Role Awareness**: Different capabilities for Hosts vs Guests
- **AI-Enhanced**: Contextual information retrieval through RAG-powered assistant
- **Ephemeral by Design**: Content lifecycle tied to event duration + 24 hours

## Feature Requirements

### Event Management System

- **Event Creation**: Host-only event setup with metadata, visibility settings, asset uploads
- **Participant Management**: Host/Guest role assignment with permission-based access
- **Event Discovery**: Public event listing and private event join-code access
- **Asset Ingestion**: PDF/Image upload with AI embeddings for contextual search
- **Lifecycle Management**: Manual and automatic event cleanup after expiration

### Content Sharing (Event-Scoped)

- **Photo Stories**: 24-hour ephemeral stories visible to all event participants
- **Snap Messaging**: Direct photo messages between event participants
- **Text Annotations**: Optional overlay text on photos before posting
- **Role-Based Posting**: Host can post freely, Guest access may be read-only
- **Real-time Updates**: Live content feed with participant notifications

### AI Assistant Integration

- **Contextual Search**: RAG-powered queries against event PDFs and images
- **Streaming Responses**: Real-time chat interface with AI assistant
- **Multimodal Citations**: Text responses with image thumbnails and source references
- **Event Context**: AI responses tailored to current event's uploaded materials

### Authentication & Onboarding

- **EventSnap Identity**: Professional branding throughout auth flow
- **Event Selection**: Required event choice before main app access
- **Role Assignment**: Automatic permission setup based on Host/Guest status
- **Persistent Sessions**: Remember last active event for seamless re-entry

## Success Metrics

### Technical Success

- **App Performance**: EventSnap launches and runs without crashes
- **Real-time Features**: Content updates appear within 2 seconds
- **AI Response Time**: Assistant queries respond within 3 seconds
- **Asset Processing**: PDF/Image ingestion completes successfully
- **Event Lifecycle**: Cleanup system removes 100% of content within 25 hours post-event

### User Experience Success

- **Event Engagement**: ≥40% of participants post at least one piece of content
- **AI Utilization**: Assistant receives queries from ≥25% of participants
- **Professional Appeal**: EventSnap branding appropriate for business environments
- **Content Discovery**: Participants can easily find and consume event-relevant information
- **Role Clarity**: Users understand and operate within Host/Guest permissions

## Visual Identity & Branding

### EventSnap Brand Identity

- **Application Name**: EventSnap (evolved from Snapchat clone)
- **Target Positioning**: "Event-Driven Networking Platform"
- **Visual Theme**: Creative Light Theme with professional aesthetics
- **Primary Colors**: Purple (#7C3AED) with Hot Pink (#EC4899) accents
- **Design Philosophy**: Clean, modern, accessible for professional environments

### Creative Light Theme System

- **Color Palette**: 
  - Primary: Rich Purple (#7C3AED) with light/dark variants
  - Accent: Hot Pink (#EC4899) for interactive elements
  - Semantic: Emerald (success), Amber (warning), Rose (error)
  - Backgrounds: Clean whites (#FFFFFF, #F8FAFC, #FAFAFA)
  - Text: Dark slate for optimal readability on light backgrounds

- **Typography**: Modern font stacks with excellent readability
- **Shadows & Depth**: Subtle elevation for component hierarchy
- **Interactive States**: Purple focus states, hover effects, pressed states

## Non-Goals (Out of Scope)

- **General Social Networking**: No permanent friend/follower systems
- **Video Content**: Focus on photo-only sharing for MVP
- **Cross-Event Content**: No content sharing between different events  
- **Advanced AR/Filters**: Simple photo capture without camera effects
- **Push Notifications**: Manual refresh for content updates initially
- **Multi-Event Participation**: Users participate in one event at a time

## User Personas

### Primary Persona: "Conference Host/Organizer"

- **Goal**: Facilitate networking and information sharing at their event
- **Behavior**: Creates event, uploads materials (PDFs, images), manages participants
- **Needs**: Easy event setup, asset management, participant engagement tools
- **EventSnap Usage**: Full platform access with content creation and management capabilities

### Secondary Persona: "Event Attendee/Guest"

- **Goal**: Capture moments and access event information quickly
- **Behavior**: Joins events, consumes content, queries AI assistant for context
- **Needs**: Simple content consumption, fast information retrieval, networking opportunities
- **EventSnap Usage**: Read-focused experience with AI assistant access

### Tertiary Persona: "Professional Networker"

- **Goal**: Connect with other attendees and capture business opportunities
- **Behavior**: Active content consumption, frequent AI queries, photo sharing
- **Needs**: Professional branding, business-appropriate content, contextual information
- **EventSnap Usage**: Balanced content consumption and creation within professional context

## Platform Evolution Context

### Original Vision vs Current Reality

- **Started As**: Snapchat clone for learning mobile development
- **Evolved Into**: Professional Event-Driven Networking Platform
- **Key Transformation**: Consumer social → Business/conference tool
- **Brand Evolution**: Dark Snapchat aesthetic → Light EventSnap professional design

### Strategic Positioning

- **Market Position**: Event-specific social platform with AI enhancement
- **Competitive Advantage**: Ephemeral content + AI-powered contextual search
- **Target Events**: Tech conferences, creative festivals, professional gatherings
- **Value Proposition**: "Capture moments, access context, connect meaningfully"

### Technical Foundation

- **Architecture**: Event-centric with role-based permissions
- **AI Integration**: RAG-powered assistant with Pinecone vector search
- **Content Lifecycle**: Automatic expiration tied to event duration
- **Theme System**: Professional Creative Light Theme with comprehensive token architecture
- **Quality Standards**: TypeScript clean, ESLint compliant, production-ready

## Success Criteria Summary

The EventSnap platform succeeds when:

1. **Professional Appeal**: Business users find the EventSnap branding and Creative Light Theme appropriate for their events
2. **Event Engagement**: Participants actively use the platform to capture and share moments
3. **AI Value**: The assistant provides meaningful, contextual responses to user queries
4. **Technical Reliability**: Platform performs consistently with proper content lifecycle management
5. **User Experience**: Role-based permissions feel natural and enhance rather than restrict the experience

**Current Status**: Visual transformation complete, AI assistant integration ready to begin.
