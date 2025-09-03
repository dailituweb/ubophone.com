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

function TermsOfServicePage() {
  return (
    <Container>
      <Content>
        <Title>Terms of Service</Title>
        <Subtitle>
          Welcome to Ubophone! These Terms of Service govern your use of our VoIP calling platform 
          and services. By using Ubophone, you agree to these terms.
        </Subtitle>

        <Section>
          <SectionTitle>1. Acceptance of Terms</SectionTitle>
          <Text>
            By accessing or using Ubophone's services, you agree to be bound by these Terms of Service 
            and our Privacy Policy. If you do not agree to these terms, please do not use our services.
          </Text>
        </Section>

        <Section>
          <SectionTitle>2. Description of Service</SectionTitle>
          <Text>
            Ubophone provides Voice over Internet Protocol (VoIP) calling services, including:
          </Text>
          <List>
            <ListItem>International and domestic calling</ListItem>
            <ListItem>Call management and history</ListItem>
            <ListItem>Account management and billing</ListItem>
            <ListItem>Contact management features</ListItem>
            <ListItem>Call recording and voicemail services</ListItem>
          </List>
        </Section>

        <HighlightBox>
          <HighlightText>
            📞 Ubophone is designed for legitimate communication purposes only. 
            Any misuse or illegal activity is strictly prohibited.
          </HighlightText>
        </HighlightBox>

        <Section>
          <SectionTitle>3. User Accounts and Registration</SectionTitle>
          <Text>
            To use our services, you must create an account and provide accurate information. You are responsible for:
          </Text>
          <List>
            <ListItem>Maintaining the security of your account credentials</ListItem>
            <ListItem>All activities that occur under your account</ListItem>
            <ListItem>Notifying us immediately of any unauthorized use</ListItem>
            <ListItem>Keeping your account information up to date</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>4. Acceptable Use Policy</SectionTitle>
          <Text>You agree not to use our services for:</Text>
          <List>
            <ListItem>Illegal activities or violations of local, state, or international laws</ListItem>
            <ListItem>Harassment, abuse, or threatening behavior</ListItem>
            <ListItem>Spam calls, robocalls, or unsolicited commercial communications</ListItem>
            <ListItem>Interfering with or disrupting our services or networks</ListItem>
            <ListItem>Attempting to gain unauthorized access to our systems</ListItem>
            <ListItem>Transmitting malware, viruses, or harmful code</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>5. Payment and Billing</SectionTitle>
          <Text>
            Our services operate on a prepaid credit system:
          </Text>
          <List>
            <ListItem>You must maintain sufficient account balance for calls</ListItem>
            <ListItem>Charges are deducted from your account balance in real-time</ListItem>
            <ListItem>All payments are processed securely through our payment partners</ListItem>
            <ListItem>Refunds are subject to our refund policy</ListItem>
            <ListItem>You are responsible for all charges incurred under your account</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>6. Service Availability</SectionTitle>
          <Text>
            While we strive for high availability, we cannot guarantee uninterrupted service. 
            Service may be temporarily unavailable due to maintenance, technical issues, or 
            circumstances beyond our control.
          </Text>
        </Section>

        <Section>
          <SectionTitle>7. Privacy and Data Protection</SectionTitle>
          <Text>
            Your privacy is important to us. Our collection and use of personal information 
            is governed by our Privacy Policy, which is incorporated into these terms by reference.
          </Text>
        </Section>

        <Section>
          <SectionTitle>8. Intellectual Property</SectionTitle>
          <Text>
            The Ubophone service, including its software, design, and content, is protected by 
            intellectual property laws. You may not copy, modify, distribute, or reverse engineer 
            our services without permission.
          </Text>
        </Section>

        <Section>
          <SectionTitle>9. Limitation of Liability</SectionTitle>
          <Text>
            To the maximum extent permitted by law, Ubophone shall not be liable for any indirect, 
            incidental, special, consequential, or punitive damages arising from your use of our services.
          </Text>
        </Section>

        <Section>
          <SectionTitle>10. Termination</SectionTitle>
          <Text>
            We may suspend or terminate your account if you violate these terms or engage in 
            prohibited activities. You may terminate your account at any time by contacting support.
          </Text>
        </Section>

        <Section>
          <SectionTitle>11. Dispute Resolution</SectionTitle>
          <Text>
            Any disputes arising from these terms or your use of our services will be resolved 
            through binding arbitration in accordance with applicable arbitration rules.
          </Text>
        </Section>

        <Section>
          <SectionTitle>12. Emergency Services</SectionTitle>
          <Text>
            <strong>Important:</strong> Ubophone is not a replacement for traditional phone service 
            and may not support emergency calling (911/emergency services) in all areas. You should 
            maintain alternative means to access emergency services.
          </Text>
        </Section>

        <Section>
          <SectionTitle>13. Changes to Terms</SectionTitle>
          <Text>
            We may update these Terms of Service from time to time. We will notify you of any 
            material changes, and continued use of our services constitutes acceptance of the updated terms.
          </Text>
        </Section>

        <Section>
          <SectionTitle>14. Governing Law</SectionTitle>
          <Text>
            These terms are governed by and construed in accordance with the laws of the jurisdiction 
            where Ubophone operates, without regard to conflict of law principles.
          </Text>
        </Section>

        <ContactInfo>
          <SectionTitle>Contact Information</SectionTitle>
          <Text>
            If you have questions about these Terms of Service, please contact us:
          </Text>
          <Text>
            <strong>Email:</strong> legal@ubophone.com<br/>
            <strong>Support:</strong> support@ubophone.com<br/>
            <strong>Address:</strong> Ubophone Legal Department<br/>
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

export default TermsOfServicePage;