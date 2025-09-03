import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  min-height: 100vh;
  background: #FAFAFA;
  padding: 2rem 1rem;
`;

const Content = styled.div`
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 0;
  border: 3px solid #000;
  box-shadow: 8px 8px 0 #000;
  padding: 3rem 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: #0a0f2f;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 3rem;
  line-height: 1.6;
`;

const Section = styled.section`
  margin-bottom: 2.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #0a0f2f;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const Text = styled.p`
  font-size: 1rem;
  color: #333;
  line-height: 1.7;
  margin-bottom: 1rem;
`;

const List = styled.ul`
  margin: 1rem 0;
  padding-left: 2rem;
`;

const ListItem = styled.li`
  font-size: 1rem;
  color: #333;
  line-height: 1.7;
  margin-bottom: 0.5rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  border: 2px solid #000;
`;

const TableHeader = styled.th`
  background: #0a0f2f;
  color: white;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  border: 1px solid #000;
`;

const TableCell = styled.td`
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  vertical-align: top;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background: #f8f9fa;
  }
`;

const HighlightBox = styled.div`
  background: #FFC900;
  border: 3px solid #000;
  padding: 1.5rem;
  margin: 2rem 0;
  border-radius: 0;
  box-shadow: 4px 4px 0 #000;
`;

const HighlightText = styled.p`
  font-size: 1rem;
  font-weight: 600;
  color: #0a0f2f;
  margin: 0;
  line-height: 1.6;
`;

const ContactInfo = styled.div`
  background: #f8f9fa;
  border: 2px solid #000;
  padding: 1.5rem;
  margin-top: 2rem;
  border-radius: 0;
`;

const LastUpdated = styled.div`
  font-size: 0.9rem;
  color: #666;
  text-align: center;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 2px solid #e5e7eb;
`;

function CookiePolicyPage() {
  return (
    <Container>
      <Content>
        <Title>Cookie Policy</Title>
        <Subtitle>
          This Cookie Policy explains how Ubophone uses cookies and similar technologies 
          to recognize you when you visit our website and use our services.
        </Subtitle>

        <Section>
          <SectionTitle>1. What Are Cookies?</SectionTitle>
          <Text>
            Cookies are small data files that are placed on your computer or mobile device when you 
            visit a website. Cookies are widely used by website owners to make their websites work, 
            or to work more efficiently, as well as to provide reporting information.
          </Text>
        </Section>

        <Section>
          <SectionTitle>2. Why Do We Use Cookies?</SectionTitle>
          <Text>We use cookies for several reasons:</Text>
          <List>
            <ListItem><strong>Essential Functionality:</strong> To enable core website features and user authentication</ListItem>
            <ListItem><strong>Performance:</strong> To analyze how visitors use our website and improve functionality</ListItem>
            <ListItem><strong>User Experience:</strong> To remember your preferences and customize your experience</ListItem>
            <ListItem><strong>Security:</strong> To protect against fraud and enhance website security</ListItem>
          </List>
        </Section>

        <HighlightBox>
          <HighlightText>
            🍪 We only use cookies that are necessary for our service to function properly. 
            We do not use cookies for advertising or tracking across other websites.
          </HighlightText>
        </HighlightBox>

        <Section>
          <SectionTitle>3. Types of Cookies We Use</SectionTitle>
          <Table>
            <thead>
              <tr>
                <TableHeader>Cookie Type</TableHeader>
                <TableHeader>Purpose</TableHeader>
                <TableHeader>Duration</TableHeader>
              </tr>
            </thead>
            <tbody>
              <TableRow>
                <TableCell><strong>Essential Cookies</strong></TableCell>
                <TableCell>Authentication, security, and core functionality</TableCell>
                <TableCell>Session or up to 30 days</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Preference Cookies</strong></TableCell>
                <TableCell>Remember your settings and preferences</TableCell>
                <TableCell>Up to 1 year</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Analytics Cookies</strong></TableCell>
                <TableCell>Understand how you use our service</TableCell>
                <TableCell>Up to 2 years</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Security Cookies</strong></TableCell>
                <TableCell>Detect suspicious activity and prevent fraud</TableCell>
                <TableCell>Session or up to 24 hours</TableCell>
              </TableRow>
            </tbody>
          </Table>
        </Section>

        <Section>
          <SectionTitle>4. Specific Cookies We Use</SectionTitle>
          <Table>
            <thead>
              <tr>
                <TableHeader>Cookie Name</TableHeader>
                <TableHeader>Purpose</TableHeader>
                <TableHeader>Type</TableHeader>
              </tr>
            </thead>
            <tbody>
              <TableRow>
                <TableCell>auth_token</TableCell>
                <TableCell>User authentication and session management</TableCell>
                <TableCell>Essential</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>user_preferences</TableCell>
                <TableCell>Store user interface preferences and settings</TableCell>
                <TableCell>Preference</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>call_quality_metrics</TableCell>
                <TableCell>Track call quality for service improvement</TableCell>
                <TableCell>Analytics</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>security_session</TableCell>
                <TableCell>Fraud detection and security monitoring</TableCell>
                <TableCell>Security</TableCell>
              </TableRow>
            </tbody>
          </Table>
        </Section>

        <Section>
          <SectionTitle>5. Third-Party Cookies</SectionTitle>
          <Text>
            We may use third-party services that set their own cookies. These include:
          </Text>
          <List>
            <ListItem><strong>Payment Processors:</strong> Stripe and other payment providers for secure transactions</ListItem>
            <ListItem><strong>Analytics Services:</strong> To understand website usage and improve our service</ListItem>
            <ListItem><strong>Security Services:</strong> To protect against fraud and abuse</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>6. How to Control Cookies</SectionTitle>
          <Text>
            You have several options to control or limit how we and our partners use cookies:
          </Text>
          <List>
            <ListItem><strong>Browser Settings:</strong> Most browsers allow you to control cookies through their settings</ListItem>
            <ListItem><strong>Cookie Preferences:</strong> Use our cookie preference center to manage your choices</ListItem>
            <ListItem><strong>Opt-Out Links:</strong> Use opt-out mechanisms provided by third-party services</ListItem>
          </List>
          <Text>
            <strong>Note:</strong> Disabling essential cookies may affect the functionality of our service.
          </Text>
        </Section>

        <Section>
          <SectionTitle>7. Browser Cookie Controls</SectionTitle>
          <Text>Here's how to manage cookies in popular browsers:</Text>
          <List>
            <ListItem><strong>Chrome:</strong> Settings &gt; Privacy and security &gt; Cookies and other site data</ListItem>
            <ListItem><strong>Firefox:</strong> Settings &gt; Privacy & Security &gt; Cookies and Site Data</ListItem>
            <ListItem><strong>Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data</ListItem>
            <ListItem><strong>Edge:</strong> Settings &gt; Cookies and site permissions &gt; Cookies and site data</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>8. Mobile Device Settings</SectionTitle>
          <Text>
            On mobile devices, you can control cookies and tracking through your device settings:
          </Text>
          <List>
            <ListItem><strong>iOS:</strong> Settings &gt; Privacy & Security &gt; Tracking</ListItem>
            <ListItem><strong>Android:</strong> Settings &gt; Privacy &gt; Ads</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>9. Cookie Updates</SectionTitle>
          <Text>
            We may update this Cookie Policy from time to time to reflect changes in our practices 
            or for other operational, legal, or regulatory reasons. We encourage you to review this 
            policy periodically.
          </Text>
        </Section>

        <Section>
          <SectionTitle>10. Data Retention</SectionTitle>
          <Text>
            Cookies are retained for different periods depending on their purpose:
          </Text>
          <List>
            <ListItem><strong>Session Cookies:</strong> Deleted when you close your browser</ListItem>
            <ListItem><strong>Persistent Cookies:</strong> Remain until expiry date or manual deletion</ListItem>
            <ListItem><strong>Analytics Cookies:</strong> Typically retained for 1-2 years</ListItem>
          </List>
        </Section>

        <ContactInfo>
          <SectionTitle>Questions About Cookies?</SectionTitle>
          <Text>
            If you have any questions about our use of cookies or other technologies, please contact us:
          </Text>
          <Text>
            <strong>Email:</strong> privacy@ubophone.com<br/>
            <strong>Subject:</strong> Cookie Policy Inquiry<br/>
            <strong>Address:</strong> Ubophone Privacy Team<br/>
            123 VoIP Street, Tech City, TC 12345
          </Text>
        </ContactInfo>

        <LastUpdated>
          Last updated: July 7, 2025
        </LastUpdated>
      </Content>
    </Container>
  );
}

export default CookiePolicyPage;