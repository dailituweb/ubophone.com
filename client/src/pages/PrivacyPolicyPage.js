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

function PrivacyPolicyPage() {
  return (
    <Container>
      <Content>
        <Title>Privacy Policy</Title>
        <Subtitle>
          Your privacy is important to us. This Privacy Policy explains how Ubophone collects, 
          uses, and protects your personal information when you use our VoIP calling services.
        </Subtitle>

        <Section>
          <SectionTitle>1. Information We Collect</SectionTitle>
          <Text>
            We collect information you provide directly to us, such as when you create an account, 
            make calls, or contact us for support.
          </Text>
          <List>
            <ListItem><strong>Account Information:</strong> Name, email address, phone number, and billing information</ListItem>
            <ListItem><strong>Call Data:</strong> Call duration, numbers dialed, call quality metrics</ListItem>
            <ListItem><strong>Usage Information:</strong> How you use our service, features accessed, and preferences</ListItem>
            <ListItem><strong>Device Information:</strong> Browser type, operating system, IP address</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>2. How We Use Your Information</SectionTitle>
          <Text>We use the information we collect to:</Text>
          <List>
            <ListItem>Provide, maintain, and improve our VoIP calling services</ListItem>
            <ListItem>Process payments and manage your account</ListItem>
            <ListItem>Send you technical notices and support messages</ListItem>
            <ListItem>Respond to your comments and questions</ListItem>
            <ListItem>Analyze usage patterns to improve service quality</ListItem>
          </List>
        </Section>

        <HighlightBox>
          <HighlightText>
            🔒 We never sell your personal information to third parties. Your call data and 
            personal information are protected with industry-standard encryption.
          </HighlightText>
        </HighlightBox>

        <Section>
          <SectionTitle>3. Information Sharing</SectionTitle>
          <Text>
            We may share your information only in the following limited circumstances:
          </Text>
          <List>
            <ListItem><strong>Service Providers:</strong> With trusted third parties who help us operate our service (like payment processors)</ListItem>
            <ListItem><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</ListItem>
            <ListItem><strong>Business Transfers:</strong> In connection with a merger, sale, or acquisition of our company</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>4. Data Security</SectionTitle>
          <Text>
            We implement appropriate technical and organizational measures to protect your personal 
            information against unauthorized access, alteration, disclosure, or destruction. This includes:
          </Text>
          <List>
            <ListItem>Encryption of data in transit and at rest</ListItem>
            <ListItem>Regular security audits and assessments</ListItem>
            <ListItem>Access controls and authentication measures</ListItem>
            <ListItem>Secure data centers and infrastructure</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>5. Your Rights and Choices</SectionTitle>
          <Text>You have the right to:</Text>
          <List>
            <ListItem>Access and update your personal information</ListItem>
            <ListItem>Delete your account and associated data</ListItem>
            <ListItem>Opt out of marketing communications</ListItem>
            <ListItem>Request a copy of your data</ListItem>
            <ListItem>Lodge a complaint with a supervisory authority</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>6. Data Retention</SectionTitle>
          <Text>
            We retain your personal information for as long as necessary to provide our services 
            and comply with legal obligations. Call records are typically retained for billing 
            and quality purposes for up to 12 months.
          </Text>
        </Section>

        <Section>
          <SectionTitle>7. International Transfers</SectionTitle>
          <Text>
            Your information may be transferred to and processed in countries other than your 
            own. We ensure appropriate safeguards are in place to protect your data in accordance 
            with this Privacy Policy.
          </Text>
        </Section>

        <Section>
          <SectionTitle>8. Children's Privacy</SectionTitle>
          <Text>
            Our service is not intended for children under 13 years of age. We do not knowingly 
            collect personal information from children under 13.
          </Text>
        </Section>

        <Section>
          <SectionTitle>9. Changes to This Policy</SectionTitle>
          <Text>
            We may update this Privacy Policy from time to time. We will notify you of any 
            material changes by posting the new Privacy Policy on this page and updating the 
            "Last Updated" date.
          </Text>
        </Section>

        <ContactInfo>
          <SectionTitle>Contact Us</SectionTitle>
          <Text>
            If you have any questions about this Privacy Policy or our data practices, 
            please contact us at:
          </Text>
          <Text>
            <strong>Email:</strong> privacy@ubophone.com<br/>
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

export default PrivacyPolicyPage;