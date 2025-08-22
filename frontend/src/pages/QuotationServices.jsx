import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { updateQuotation } from '../services/quotations';

const HEADERS = [
  'Project Registration',
  'Legal Consultation', 
  'Project Compliance',
  'Package A',
  'Package B',
  'Package C',
  'Package D',
  'Customized Header'
];

const SERVICES = {
  'Project Registration': [
    { id: 'change_promoter', label: 'Change of Promoter', price: 0, subServices: [
      { id: 'change_promoter_15', text: 'Change of Promoters as per Section 15: Updating project promoter information in accordance with MahaRERA guidelines.' },
      { id: 'drafting_annexure', text: 'Drafting of Annexure A, B, and C: Compiling project-related information into required annexures for MahaRERA submission.' },
      { id: 'drafting_consent', text: 'Drafting of Consent Letter: Formalizing stakeholders\' approval for project-related changes or actions.' },
      { id: 'follow_up_certificate', text: 'Follow-up Till Certificate is Generated: Continuous communication with MahaRERA until project certificate issuance.' },
      { id: 'hearing_maharera', text: 'Hearing at MahaRERA Office: Attending sessions at MahaRERA to address project-related queries or issues.' },
      { id: 'drafting_correction', text: 'Drafting and Uploading of Correction Application: Rectifying errors in project documentation and re-submitting to MahaRERA.' },
      { id: 'drafting_format_c', text: 'Drafting of Format C: Complying with MahaRERA-prescribed document formats for reporting and compliance purposes.' },
      { id: 'scrutiny_assistance', text: 'Scrutiny Assistance Until Certificate is Generated: Providing support during MahaRERA scrutiny process until project certificate issuance' }
    ]},
    { id: 'maharera_profile_updation', label: 'MahaRERA Profile Updation', price: 0, subServices: [
      'Disclosure of Sold/Unsold Inventory: Thorough drafting and meticulous uploading of the disclosure document showcasing the status of sold and unsold inventory, ensuring accuracy and compliance.',
      'Format D Drafting and Uploading: Proficient drafting and systematic uploading of Format D.',
      'CERSAI Report Submission: Facilitating the submission and generation of the CERSAI report, ensuring completeness and adherence to regulatory standards',
      'Drafted Formats for Form 2A: Preparation and provision of meticulously drafted formats required for Form 2A',
      'MahaRERA Profile Update: Complete and accurate updating of the MahaRERA profile, ensuring all necessary information is current and compliant pertaining to extension service'
    ]},
    { id: 'correction_fsi', label: 'Correction (Change of FSI)', price: 0, subServices: [
      'Project Correction under Section 14 (2): Initiating corrections to the project as per the provisions outlined in Section 14 (2) of the relevant regulations.',
      'Consultation regarding RERA Rules and Regulations: Providing guidance and advice on compliance with the rules and regulations stipulated by the Real Estate Regulatory Authority (RERA).',
      'Uploading of all the relevant documents for Project Corrections: Ensuring that all necessary documents for project corrections are accurately uploaded and submitted in adherence to regulatory requirements.',
      'Drafting all the relevant Applications, Undertakings, and Declarations: Preparing and drafting the required applications, undertakings, and declarations to facilitate the correction process efficiently and effectively.',
      'Scrutiny Assistance: Offering support and assistance during the scrutiny process to ensure compliance and adherence to all regulatory standards.',
      'Coordinating with the MahaRERA Authorities: Facilitating communication and coordination with the relevant authorities at MahaRERA (Maharashtra Real Estate Regulatory Authority) to streamline the correction process and address any queries or concerns promptly',
      'Drafting of a detailed consent letter for correction: Creating a comprehensive consent letter outlining the details of the correction process to the allotees, adhering to regulatory specifications'
    ]},
    { id: 'maharera_profile_migration', label: 'MahaRERA Profile Migration', price: 0, subServices: [
      'Updating the Promoter/Partner(s)/Director(s) Details on the Portal.',
      'Adding Grievance Officer and Single point of Contact.',
      'Updation of Project Professional Details, Building Details, Progress of the Project etc.',
      'Generating & Updating of Form 1 (Architect Certificate), Form 2 (Certificate of Engineer) and Form 3 (CA Certificate).',
      'Generation of CERSAI Report.',
      'Drafting and updating Legal & Financial Encumbrances of the project (If any).',
      'Drafted Formats of Authorized Signatory, Development Plan (DP) Remark Declaration, Financial Encumbrance Letter and Legal Encumbrance Letter.',
      'Updation and Migration of the old MahaRERA Profile Details to the new RERA website "MahaRERA CRITI".'
    ]},
    { id: 'removal_abeyance_qpr', label: 'Removal from Abeyance (QPR)', price: 0, subServices: [
      'Responding to the MahaRERA Notice: Preparing and submitting an appropriate reply to the notice received from MahaRERA, addressing all concerns raised.',
      'Representation in Virtual Meetings: Attending any online meetings or hearings with MahaRERA officials on behalf of the client to present their case or provide clarifications.',
      'Providing Guidance on RERA Rules and Regulations: Offering expert advice and explanations on the relevant Real Estate (Regulation and Development) Act, 2016 provisions applicable to the issue at hand.',
      'Liaising with MahaRERA Authorities: Acting as a point of Contact to communicate and coordinate with MahaRERA officials for efficient resolution of the matter.',
      'Drafting Necessary Applications, Undertakings, and Declarations: Preparing and submitting all required legal documents, such as applications for compliance, undertakings, or declarations, to address the notice or related compliance requirements.'
    ]},
    { id: 'extension_7_3', label: 'Extension of Project Completion Date u/s 7(3)', price: 0, subServices: [
      'Project Extension under Section 7(3): Extending the project under Section 7(3) regulations involves prolonging the project\'s duration in accordance with legal provisions.',
      'Consultation regarding RERA Rules and Regulations: Providing advisory services on compliance with the rules and regulations set forth by the Real Estate Regulatory Authority (RERA).',
      'Uploading of all the relevant documents for Project Extension: Ensuring that all pertinent documents required for extending the project are appropriately uploaded and submitted as per the prescribed guidelines.',
      'Drafting of a detailed consent letter for correction: Creating a comprehensive consent letter outlining the details of the Extension process to the allotees, adhering to regulatory specifications',
      'Scrutiny Assistance: Providing support and guidance during the scrutiny process to ensure compliance and smooth execution of all regulatory obligations'
    ]},
    { id: 'project_closure', label: 'Project Closure', price: 0, subServices: [
      'Project Closure: Applying for Project Closure ensuring everything is in order confirming that the developer has met all obligations under the RERA Act.',
      'Consultation regarding RERA Rules and Regulations: Providing guidance and advice on compliance with the rules and regulations stipulated by the Real Estate Regulatory Authority (RERA).',
      'Drafting all the relevant Applications, Undertakings, and Declarations: Preparing and drafting the required applications, undertakings, and declarations to facilitate the closure process efficiently and effectively.',
      'Uploading of all the relevant documents for Project Closure: Ensuring that all necessary documents for Project Closure are accurately uploaded and submitted in adherence to MahaRERA Guidelines.'
    ]},
    { id: 'extension_6', label: 'Extension of Project Completion Date u/s 6', price: 0, subServices: [
      'Project Extension under Section 6: Extending the project under Section 6 regulations involves prolonging the project\'s duration in accordance with legal provisions.',
      'Consultation regarding RERA Rules and Regulations: Providing advisory services on compliance with the rules and regulations set forth by the Real Estate Regulatory Authority (RERA).',
      'Uploading of all the relevant documents for Project Extension: Ensuring that all pertinent documents required for extending the project are appropriately uploaded and submitted as per the prescribed guidelines.',
      'Scrutiny Assistance: Providing support and guidance during the scrutiny process to ensure compliance and smooth execution of all regulatory obligations'
    ]},
    { id: 'post_facto_extension', label: 'Post Facto Extension', price: 0, subServices: [
      'Project Extension : Extending the projects completion date until the Occupancy Certificate. Regulations involves prolonging the project\'s duration in accordance with legal provisions.',
      'Consultation regarding RERA Rules & Regulations: Providing advisory services on compliance with the rules and regulations set forth by the Real Estate Regulatory Authority (RERA).',
      'Uploading all the relevant documents for Project Extension: Ensuring that all pertinent documents required for extending the project are appropriately uploaded and submitted as per the prescribed guidelines.',
      'Scrutiny Assistance: Providing support and guidance during the scrutiny process to ensure compliance and smooth execution of all regulatory obligations.'
    ]},
    { id: 'extension_order_40', label: 'Extension Under Order 40', price: 0, subServices: [
      'Order 40 Extension Comprehensive handling of project extension under Order 40, ensuring seamless procedures without necessitating majority consents.',
      'RERA Rules Consultation Thorough consultation on RERA rules and regulations to ensure complete compliance and understanding of statutory requirements.',
      'Document Compilation and Uploading Methodical collection and uploading of all pertinent documents essential for the project extension, meticulously organized for easy accessibility.',
      'Drafting Services Professional drafting of all necessary applications, undertakings, and declarations, ensuring accuracy and adherence to legal norms.',
      'Scrutiny Support Providing diligent assistance and support during the scrutiny process, ensuring meticulous examination and addressing any queries promptly.',
      'MahaRERA Coordination Efficient coordination and communication with MahaRERA authorities on behalf of the project, ensuring smooth interactions and compliance with regulatory authorities',
      'Hearing Representation Attending the hearing for the extension, representing the project\'s interests, and ensuring effective communication with concerned authorities'
    ]},
    { id: 'correction_bank_account', label: 'Correction (Change of Bank Account)', price: 0, subServices: [] },
    { id: 'removal_abeyance_lapsed', label: 'Removal from Abeyance (Lapsed)', price: 0, subServices: [] },
    { id: 'project_de_registration', label: 'Project De-Registration', price: 0, subServices: [] },
    { id: 'drafting_title_report_a', label: 'Drafting of Title Report in Format A', price: 0, subServices: [] },
    { id: 'correction_other_details', label: 'Correction - Change of Other Details', price: 0, subServices: [] }
  ],
  'Legal Consultation': [
    { id: 'change_promoter', label: 'Change of Promoter', price: 0, subServices: [
      'Change of Promoters as per Section 15: Updating project promoter information in accordance with MahaRERA guidelines.',
      'Drafting of Annexure A, B, and C: Compiling project-related information into required annexures for MahaRERA submission.',
      'Drafting of Consent Letter: Formalizing stakeholders\' approval for project-related changes or actions.',
      'Follow-up Till Certificate is Generated: Continuous communication with MahaRERA until project certificate issuance.',
      'Hearing at MahaRERA Office: Attending sessions at MahaRERA to address project-related queries or issues.',
      'Drafting and Uploading of Correction Application: Rectifying errors in project documentation and re-submitting to MahaRERA.',
      'Drafting of Format C: Complying with MahaRERA-prescribed document formats for reporting and compliance purposes.',
      'Scrutiny Assistance Until Certificate is Generated: Providing support during MahaRERA scrutiny process until project certificate issuance'
    ]},
    { id: 'maharera_profile_updation', label: 'MahaRERA Profile Updation', price: 0, subServices: [
      'Disclosure of Sold/Unsold Inventory: Thorough drafting and meticulous uploading of the disclosure document showcasing the status of sold and unsold inventory, ensuring accuracy and compliance.',
      'Format D Drafting and Uploading: Proficient drafting and systematic uploading of Format D.',
      'CERSAI Report Submission: Facilitating the submission and generation of the CERSAI report, ensuring completeness and adherence to regulatory standards',
      'Drafted Formats for Form 2A: Preparation and provision of meticulously drafted formats required for Form 2A',
      'MahaRERA Profile Update: Complete and accurate updating of the MahaRERA profile, ensuring all necessary information is current and compliant pertaining to extension service'
    ]},
    { id: 'correction_fsi', label: 'Correction (Change of FSI)', price: 0, subServices: [
      'Project Correction under Section 14 (2): Initiating corrections to the project as per the provisions outlined in Section 14 (2) of the relevant regulations.',
      'Consultation regarding RERA Rules and Regulations: Providing guidance and advice on compliance with the rules and regulations stipulated by the Real Estate Regulatory Authority (RERA).',
      'Uploading of all the relevant documents for Project Corrections: Ensuring that all necessary documents for project corrections are accurately uploaded and submitted in adherence to regulatory requirements.',
      'Drafting all the relevant Applications, Undertakings, and Declarations: Preparing and drafting the required applications, undertakings, and declarations to facilitate the correction process efficiently and effectively.',
      'Scrutiny Assistance: Offering support and assistance during the scrutiny process to ensure compliance and adherence to all regulatory standards.',
      'Coordinating with the MahaRERA Authorities: Facilitating communication and coordination with the relevant authorities at MahaRERA (Maharashtra Real Estate Regulatory Authority) to streamline the correction process and address any queries or concerns promptly',
      'Drafting of a detailed consent letter for correction: Creating a comprehensive consent letter outlining the details of the correction process to the allotees, adhering to regulatory specifications'
    ]},
    { id: 'maharera_profile_migration', label: 'MahaRERA Profile Migration', price: 0, subServices: [
      'Updating the Promoter/Partner(s)/Director(s) Details on the Portal.',
      'Adding Grievance Officer and Single point of Contact.',
      'Updation of Project Professional Details, Building Details, Progress of the Project etc.',
      'Generating & Updating of Form 1 (Architect Certificate), Form 2 (Certificate of Engineer) and Form 3 (CA Certificate).',
      'Generation of CERSAI Report.',
      'Drafting and updating Legal & Financial Encumbrances of the project (If any).',
      'Drafted Formats of Authorized Signatory, Development Plan (DP) Remark Declaration, Financial Encumbrance Letter and Legal Encumbrance Letter.',
      'Updation and Migration of the old MahaRERA Profile Details to the new RERA website "MahaRERA CRITI".'
    ]},
    { id: 'removal_abeyance_qpr', label: 'Removal from Abeyance (QPR)', price: 0, subServices: [
      'Responding to the MahaRERA Notice: Preparing and submitting an appropriate reply to the notice received from MahaRERA, addressing all concerns raised.',
      'Representation in Virtual Meetings: Attending any online meetings or hearings with MahaRERA officials on behalf of the client to present their case or provide clarifications.',
      'Providing Guidance on RERA Rules and Regulations: Offering expert advice and explanations on the relevant Real Estate (Regulation and Development) Act, 2016 provisions applicable to the issue at hand.',
      'Liaising with MahaRERA Authorities: Acting as a point of Contact to communicate and coordinate with MahaRERA officials for efficient resolution of the matter.',
      'Drafting Necessary Applications, Undertakings, and Declarations: Preparing and submitting all required legal documents, such as applications for compliance, undertakings, or declarations, to address the notice or related compliance requirements.'
    ]},
    { id: 'extension_7_3', label: 'Extension of Project Completion Date u/s 7(3)', price: 0, subServices: [
      'Project Extension under Section 7(3): Extending the project under Section 7(3) regulations involves prolonging the project\'s duration in accordance with legal provisions.',
      'Consultation regarding RERA Rules and Regulations: Providing advisory services on compliance with the rules and regulations set forth by the Real Estate Regulatory Authority (RERA).',
      'Uploading of all the relevant documents for Project Extension: Ensuring that all pertinent documents required for extending the project are appropriately uploaded and submitted as per the prescribed guidelines.',
      'Drafting of a detailed consent letter for correction: Creating a comprehensive consent letter outlining the details of the Extension process to the allotees, adhering to regulatory specifications',
      'Scrutiny Assistance: Providing support and guidance during the scrutiny process to ensure compliance and smooth execution of all regulatory obligations'
    ]},
    { id: 'project_closure', label: 'Project Closure', price: 0, subServices: [
      'Project Closure: Applying for Project Closure ensuring everything is in order confirming that the developer has met all obligations under the RERA Act.',
      'Consultation regarding RERA Rules and Regulations: Providing guidance and advice on compliance with the rules and regulations stipulated by the Real Estate Regulatory Authority (RERA).',
      'Drafting all the relevant Applications, Undertakings, and Declarations: Preparing and drafting the required applications, undertakings, and declarations to facilitate the closure process efficiently and effectively.',
      'Uploading of all the relevant documents for Project Closure: Ensuring that all necessary documents for Project Closure are accurately uploaded and submitted in adherence to MahaRERA Guidelines.'
    ]},
    { id: 'extension_6', label: 'Extension of Project Completion Date u/s 6', price: 0, subServices: [
      'Project Extension under Section 6: Extending the project under Section 6 regulations involves prolonging the project\'s duration in accordance with legal provisions.',
      'Consultation regarding RERA Rules and Regulations: Providing advisory services on compliance with the rules and regulations set forth by the Real Estate Regulatory Authority (RERA).',
      'Uploading of all the relevant documents for Project Extension: Ensuring that all pertinent documents required for extending the project are appropriately uploaded and submitted as per the prescribed guidelines.',
      'Scrutiny Assistance: Providing support and guidance during the scrutiny process to ensure compliance and smooth execution of all regulatory obligations'
    ]},
    { id: 'post_facto_extension', label: 'Post Facto Extension', price: 0, subServices: [
      'Project Extension : Extending the projects completion date until the Occupancy Certificate. Regulations involves prolonging the project\'s duration in accordance with legal provisions.',
      'Consultation regarding RERA Rules & Regulations: Providing advisory services on compliance with the rules and regulations set forth by the Real Estate Regulatory Authority (RERA).',
      'Uploading all the relevant documents for Project Extension: Ensuring that all pertinent documents required for extending the project are appropriately uploaded and submitted as per the prescribed guidelines.',
      'Scrutiny Assistance: Providing support and guidance during the scrutiny process to ensure compliance and smooth execution of all regulatory obligations.'
    ]},
    { id: 'extension_order_40', label: 'Extension Under Order 40', price: 0, subServices: [
      'Order 40 Extension Comprehensive handling of project extension under Order 40, ensuring seamless procedures without necessitating majority consents.',
      'RERA Rules Consultation Thorough consultation on RERA rules and regulations to ensure complete compliance and understanding of statutory requirements.',
      'Document Compilation and Uploading Methodical collection and uploading of all pertinent documents essential for the project extension, meticulously organized for easy accessibility.',
      'Drafting Services Professional drafting of all necessary applications, undertakings, and declarations, ensuring accuracy and adherence to legal norms.',
      'Scrutiny Support Providing diligent assistance and support during the scrutiny process, ensuring meticulous examination and addressing any queries promptly.',
      'MahaRERA Coordination Efficient coordination and communication with MahaRERA authorities on behalf of the project, ensuring smooth interactions and compliance with regulatory authorities',
      'Hearing Representation Attending the hearing for the extension, representing the project\'s interests, and ensuring effective communication with concerned authorities'
    ]},
    { id: 'correction_bank_account', label: 'Correction (Change of Bank Account)', price: 0, subServices: [] },
    { id: 'removal_abeyance_lapsed', label: 'Removal from Abeyance (Lapsed)', price: 0, subServices: [] },
    { id: 'project_de_registration', label: 'Project De-Registration', price: 0, subServices: [] },
    { id: 'drafting_title_report_a', label: 'Drafting of Title Report in Format A', price: 0, subServices: [] },
    { id: 'correction_other_details', label: 'Correction - Change of Other Details', price: 0, subServices: [] }
  ],
  'Project Compliance': [
    { id: 'change_promoter', label: 'Change of Promoter', price: 0, subServices: [
      'Change of Promoters as per Section 15: Updating project promoter information in accordance with MahaRERA guidelines.',
      'Drafting of Annexure A, B, and C: Compiling project-related information into required annexures for MahaRERA submission.',
      'Drafting of Consent Letter: Formalizing stakeholders\' approval for project-related changes or actions.',
      'Follow-up Till Certificate is Generated: Continuous communication with MahaRERA until project certificate issuance.',
      'Hearing at MahaRERA Office: Attending sessions at MahaRERA to address project-related queries or issues.',
      'Drafting and Uploading of Correction Application: Rectifying errors in project documentation and re-submitting to MahaRERA.',
      'Drafting of Format C: Complying with MahaRERA-prescribed document formats for reporting and compliance purposes.',
      'Scrutiny Assistance Until Certificate is Generated: Providing support during MahaRERA scrutiny process until project certificate issuance'
    ]},
    { id: 'maharera_profile_updation', label: 'MahaRERA Profile Updation', price: 0, subServices: [
      'Disclosure of Sold/Unsold Inventory: Thorough drafting and meticulous uploading of the disclosure document showcasing the status of sold and unsold inventory, ensuring accuracy and compliance.',
      'Format D Drafting and Uploading: Proficient drafting and systematic uploading of Format D.',
      'CERSAI Report Submission: Facilitating the submission and generation of the CERSAI report, ensuring completeness and adherence to regulatory standards',
      'Drafted Formats for Form 2A: Preparation and provision of meticulously drafted formats required for Form 2A',
      'MahaRERA Profile Update: Complete and accurate updating of the MahaRERA profile, ensuring all necessary information is current and compliant pertaining to extension service'
    ]},
    { id: 'correction_fsi', label: 'Correction (Change of FSI)', price: 0, subServices: [
      'Project Correction under Section 14 (2): Initiating corrections to the project as per the provisions outlined in Section 14 (2) of the relevant regulations.',
      'Consultation regarding RERA Rules and Regulations: Providing guidance and advice on compliance with the rules and regulations stipulated by the Real Estate Regulatory Authority (RERA).',
      'Uploading of all the relevant documents for Project Corrections: Ensuring that all necessary documents for project corrections are accurately uploaded and submitted in adherence to regulatory requirements.',
      'Drafting all the relevant Applications, Undertakings, and Declarations: Preparing and drafting the required applications, undertakings, and declarations to facilitate the correction process efficiently and effectively.',
      'Scrutiny Assistance: Offering support and assistance during the scrutiny process to ensure compliance and adherence to all regulatory standards.',
      'Coordinating with the MahaRERA Authorities: Facilitating communication and coordination with the relevant authorities at MahaRERA (Maharashtra Real Estate Regulatory Authority) to streamline the correction process and address any queries or concerns promptly',
      'Drafting of a detailed consent letter for correction: Creating a comprehensive consent letter outlining the details of the correction process to the allotees, adhering to regulatory specifications'
    ]},
    { id: 'maharera_profile_migration', label: 'MahaRERA Profile Migration', price: 0, subServices: [
      'Updating the Promoter/Partner(s)/Director(s) Details on the Portal.',
      'Adding Grievance Officer and Single point of Contact.',
      'Updation of Project Professional Details, Building Details, Progress of the Project etc.',
      'Generating & Updating of Form 1 (Architect Certificate), Form 2 (Certificate of Engineer) and Form 3 (CA Certificate).',
      'Generation of CERSAI Report.',
      'Drafting and updating Legal & Financial Encumbrances of the project (If any).',
      'Drafted Formats of Authorized Signatory, Development Plan (DP) Remark Declaration, Financial Encumbrance Letter and Legal Encumbrance Letter.',
      'Updation and Migration of the old MahaRERA Profile Details to the new RERA website "MahaRERA CRITI".'
    ]},
    { id: 'removal_abeyance_qpr', label: 'Removal from Abeyance (QPR)', price: 0, subServices: [
      'Responding to the MahaRERA Notice: Preparing and submitting an appropriate reply to the notice received from MahaRERA, addressing all concerns raised.',
      'Representation in Virtual Meetings: Attending any online meetings or hearings with MahaRERA officials on behalf of the client to present their case or provide clarifications.',
      'Providing Guidance on RERA Rules and Regulations: Offering expert advice and explanations on the relevant Real Estate (Regulation and Development) Act, 2016 provisions applicable to the issue at hand.',
      'Liaising with MahaRERA Authorities: Acting as a point of Contact to communicate and coordinate with MahaRERA officials for efficient resolution of the matter.',
      'Drafting Necessary Applications, Undertakings, and Declarations: Preparing and submitting all required legal documents, such as applications for compliance, undertakings, or declarations, to address the notice or related compliance requirements.'
    ]},
    { id: 'extension_7_3', label: 'Extension of Project Completion Date u/s 7(3)', price: 0, subServices: [
      'Project Extension under Section 7(3): Extending the project under Section 7(3) regulations involves prolonging the project\'s duration in accordance with legal provisions.',
      'Consultation regarding RERA Rules and Regulations: Providing advisory services on compliance with the rules and regulations set forth by the Real Estate Regulatory Authority (RERA).',
      'Uploading of all the relevant documents for Project Extension: Ensuring that all pertinent documents required for extending the project are appropriately uploaded and submitted as per the prescribed guidelines.',
      'Drafting of a detailed consent letter for correction: Creating a comprehensive consent letter outlining the details of the Extension process to the allotees, adhering to regulatory specifications',
      'Scrutiny Assistance: Providing support and guidance during the scrutiny process to ensure compliance and smooth execution of all regulatory obligations'
    ]},
    { id: 'project_closure', label: 'Project Closure', price: 0, subServices: [
      'Project Closure: Applying for Project Closure ensuring everything is in order confirming that the developer has met all obligations under the RERA Act.',
      'Consultation regarding RERA Rules and Regulations: Providing guidance and advice on compliance with the rules and regulations stipulated by the Real Estate Regulatory Authority (RERA).',
      'Drafting all the relevant Applications, Undertakings, and Declarations: Preparing and drafting the required applications, undertakings, and declarations to facilitate the closure process efficiently and effectively.',
      'Uploading of all the relevant documents for Project Closure: Ensuring that all necessary documents for Project Closure are accurately uploaded and submitted in adherence to MahaRERA Guidelines.'
    ]},
    { id: 'extension_6', label: 'Extension of Project Completion Date u/s 6', price: 0, subServices: [
      'Project Extension under Section 6: Extending the project under Section 6 regulations involves prolonging the project\'s duration in accordance with legal provisions.',
      'Consultation regarding RERA Rules and Regulations: Providing advisory services on compliance with the rules and regulations set forth by the Real Estate Regulatory Authority (RERA).',
      'Uploading of all the relevant documents for Project Extension: Ensuring that all pertinent documents required for extending the project are appropriately uploaded and submitted as per the prescribed guidelines.',
      'Scrutiny Assistance: Providing support and guidance during the scrutiny process to ensure compliance and smooth execution of all regulatory obligations'
    ]},
    { id: 'post_facto_extension', label: 'Post Facto Extension', price: 0, subServices: [
      'Project Extension : Extending the projects completion date until the Occupancy Certificate. Regulations involves prolonging the project\'s duration in accordance with legal provisions.',
      'Consultation regarding RERA Rules & Regulations: Providing advisory services on compliance with the rules and regulations set forth by the Real Estate Regulatory Authority (RERA).',
      'Uploading all the relevant documents for Project Extension: Ensuring that all pertinent documents required for extending the project are appropriately uploaded and submitted as per the prescribed guidelines.',
      'Scrutiny Assistance: Providing support and guidance during the scrutiny process to ensure compliance and smooth execution of all regulatory obligations.'
    ]},
    { id: 'extension_order_40', label: 'Extension Under Order 40', price: 0, subServices: [
      'Order 40 Extension Comprehensive handling of project extension under Order 40, ensuring seamless procedures without necessitating majority consents.',
      'RERA Rules Consultation Thorough consultation on RERA rules and regulations to ensure complete compliance and understanding of statutory requirements.',
      'Document Compilation and Uploading Methodical collection and uploading of all pertinent documents essential for the project extension, meticulously organized for easy accessibility.',
      'Drafting Services Professional drafting of all necessary applications, undertakings, and declarations, ensuring accuracy and adherence to legal norms.',
      'Scrutiny Support Providing diligent assistance and support during the scrutiny process, ensuring meticulous examination and addressing any queries promptly.',
      'MahaRERA Coordination Efficient coordination and communication with MahaRERA authorities on behalf of the project, ensuring smooth interactions and compliance with regulatory authorities',
      'Hearing Representation Attending the hearing for the extension, representing the project\'s interests, and ensuring effective communication with concerned authorities'
    ]},
    { id: 'correction_bank_account', label: 'Correction (Change of Bank Account)', price: 0, subServices: [] },
    { id: 'removal_abeyance_lapsed', label: 'Removal from Abeyance (Lapsed)', price: 0, subServices: [] },
    { id: 'project_de_registration', label: 'Project De-Registration', price: 0, subServices: [] },
    { id: 'drafting_title_report_a', label: 'Drafting of Title Report in Format A', price: 0, subServices: [] },
    { id: 'correction_other_details', label: 'Correction - Change of Other Details', price: 0, subServices: [] }
  ],
  'Package A': [{ id: 'pkg_a', label: 'Package A Bundle', price: 50000 }],
  'Package B': [{ id: 'pkg_b', label: 'Package B Bundle', price: 75000 }],
  'Package C': [{ id: 'pkg_c', label: 'Package C Bundle', price: 100000 }],
  'Package D': [{ id: 'pkg_d', label: 'Package D Bundle', price: 150000 }],
  'Customized Header': [{ id: 'custom_service', label: 'Custom Service', price: 0 }]
};

export default function QuotationServices() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [current, setCurrent] = useState({ header: '', services: [], subServices: [], customHeaderName: '' });
  const [selections, setSelections] = useState([]);

  const selectedServiceIds = useMemo(() => selections.map(s => s.service.id), [selections]);
  const selectedSubServiceIds = useMemo(() => selections.flatMap(s => s.subServices?.map(sub => sub.id) || []), [selections]);
  
  const getAvailableServices = useMemo(() => {
    if (!current.header || current.header === 'Customized Header') return [];
    
    return SERVICES[current.header].filter(service => {
      // Filter out services that are already selected
      if (selectedServiceIds.includes(service.id)) return false;
      
      return true;
    });
  }, [current.header, selectedServiceIds]);

  function handleHeaderChange(header) {
    setCurrent({ header, services: [], subServices: [], customHeaderName: '' });
  }

  function handleServiceChange(serviceId, checked) {
    if (checked) {
      const service = SERVICES[current.header].find(s => s.id === serviceId);
      setCurrent(prev => ({ 
        ...prev, 
        services: [...prev.services, service]
      }));
    } else {
      setCurrent(prev => ({ 
        ...prev, 
        services: prev.services.filter(s => s.id !== serviceId)
      }));
    }
  }

  function handleSubServiceChange(serviceId, subServiceId, checked) {
    if (checked) {
      const service = SERVICES[current.header].find(s => s.id === serviceId);
      const subService = service.subServices.find(sub => sub.id === subServiceId);
      setCurrent(prev => ({ 
        ...prev, 
        subServices: [...prev.subServices, { serviceId, subService }]
      }));
    } else {
      setCurrent(prev => ({ 
        ...prev, 
        subServices: prev.subServices.filter(s => !(s.serviceId === serviceId && s.subService.id === subServiceId))
      }));
    }
  }

  function handleAddCurrentServices() {
    if (current.header && (current.services.length > 0 || current.subServices.length > 0)) {
      const headerName = current.header === 'Customized Header' ? current.customHeaderName : current.header;
      const newSelections = [];
      
      // Add selected services
      current.services.forEach(service => {
        newSelections.push({ header: headerName, service, subServices: [] });
      });
      
      // Add selected sub-services
      current.subServices.forEach(({ serviceId, subService }) => {
        const service = SERVICES[current.header].find(s => s.id === serviceId);
        newSelections.push({ header: headerName, service, subServices: [subService] });
      });
      
      setSelections(prev => [...prev, ...newSelections]);
      setCurrent({ header: '', services: [], subServices: [], customHeaderName: '' });
    }
  }

  function handleCustomHeaderNameChange(name) {
    setCurrent(prev => ({ ...prev, customHeaderName: name }));
  }



  function handleNext() {
    if (selections.length > 0) {
      handleSave(selections);
    }
  }

  async function handleSave(finalSelections) {
    try {
      // Transform the selections to match the expected backend format
      const transformedSelections = finalSelections.map(selection => ({
        header: selection.header,
        service: selection.service,
        subServices: selection.subServices || []
      }));
      
      await updateQuotation(id, { headers: transformedSelections });
      navigate(`/quotations/${id}/summary`);
    } catch (error) {
      alert('Failed to save services');
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: '24px auto', padding: 16, background: '#ffffff', color: '#1f2937' }}>
      {/* Header */}
      <div style={pageHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={stepBadge}>STEP 2 OF 2</span>
          </div>
          <h1 style={{ margin: 0 }}>Services Selection</h1>
          <p style={{ margin: '6px 0 0', color: '#6b7280' }}>Choose headers and services for your quotation.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btnSecondary} onClick={() => navigate('/quotations/new')}>
            Back to Step 1
          </button>
          <button style={btnPrimary} onClick={handleNext} disabled={selections.length === 0}>
            Next (Step 3)
          </button>
        </div>
      </div>

      <div style={cardSurface}>
        <div style={{ padding: 24 }}>
          {/* Header Selection */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Add Header</label>
            <select 
              value={current.header} 
              onChange={(e) => handleHeaderChange(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select a header</option>
              {HEADERS.map(header => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
          </div>

          {/* Custom Header Name Input */}
          {current.header === 'Customized Header' && (
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Custom Header Name</label>
              <input
                type="text"
                value={current.customHeaderName}
                onChange={(e) => handleCustomHeaderNameChange(e.target.value)}
                placeholder="Enter custom header name"
                style={inputStyle}
              />
            </div>
          )}

          {/* Service Selection */}
          {current.header && (current.header !== 'Customized Header' || current.customHeaderName.trim()) && (
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Select Services & Sub-Services (Multiple selection allowed)</label>
              <div style={servicesContainer}>
                {getAvailableServices.map(service => (
                  <div key={service.id} style={serviceItem}>
                    <label style={serviceLabel}>
                      <input
                        type="checkbox"
                        checked={current.services.some(s => s.id === service.id)}
                        onChange={(e) => handleServiceChange(service.id, e.target.checked)}
                        style={checkboxStyle}
                      />
                      <span style={serviceTitle}>{service.label}</span>
                    </label>
                    {service.subServices && service.subServices.length > 0 && (
                      <div style={subServicesList}>
                        <div style={subServicesHeader}>Select Sub-Services:</div>
                        {service.subServices
                          .filter(subService => !selectedSubServiceIds.includes(subService.id))
                          .map((subService, index) => (
                            <label key={index} style={subServiceLabel}>
                              <input
                                type="checkbox"
                                checked={current.subServices.some(s => s.serviceId === service.id && s.subService.id === subService.id)}
                                onChange={(e) => handleSubServiceChange(service.id, subService.id, e.target.checked)}
                                style={checkboxStyle}
                              />
                              <span style={subServiceText}>{subService.text}</span>
                            </label>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Action buttons for current header */}
              {(current.services.length > 0 || current.subServices.length > 0) && (
                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                  <button 
                    type="button" 
                    style={btnPrimary} 
                    onClick={handleAddCurrentServices}
                  >
                    Add {current.services.length + current.subServices.length} Selection{current.services.length + current.subServices.length > 1 ? 's' : ''} to {current.header === 'Customized Header' ? current.customHeaderName : current.header}
                  </button>
                  <button 
                    type="button" 
                    style={btnSecondary} 
                    onClick={() => setCurrent(prev => ({ ...prev, services: [], subServices: [] }))}
                  >
                    Clear Selection
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Selected Services Display */}
          {selections.length > 0 && (
            <div style={{ marginTop: 24, padding: 16, background: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>Selected Services & Sub-Services</h4>
              {selections.map((selection, index) => (
                <div key={index} style={selectedServiceItem}>
                  <strong>{selection.header}</strong> → {selection.service.label}
                  {selection.subServices && selection.subServices.length > 0 && (
                    <div style={selectedSubServicesList}>
                      {selection.subServices.map((subService, subIndex) => (
                        <div key={subIndex} style={selectedSubServiceItem}>
                          • {subService.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


    </div>
  );
}

const pageHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 24
};

const stepBadge = {
  background: '#1e40af',
  color: '#ffffff',
  padding: '4px 8px',
  borderRadius: 4,
  fontSize: '12px',
  fontWeight: '600'
};

const labelStyle = {
  display: 'block',
  marginBottom: 8,
  fontWeight: '600',
  color: '#374151'
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  background: '#ffffff',
  color: '#1f2937',
  fontSize: '14px'
};

const servicesContainer = {
  display: 'grid',
  gap: 12
};

const serviceItem = {
  padding: '12px 16px',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  background: '#ffffff'
};

const serviceLabel = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  cursor: 'pointer'
};

const serviceTitle = {
  fontWeight: '500',
  color: '#111827'
};

const checkboxStyle = {
  margin: 0,
  marginTop: 2
};

const subServicesList = {
  marginTop: 8,
  marginLeft: 24
};

const subServicesHeader = {
  fontSize: '14px',
  fontWeight: '500',
  color: '#374151',
  marginBottom: 8
};

const subServiceLabel = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  cursor: 'pointer',
  marginBottom: 6
};

const subServiceText = {
  fontSize: '13px',
  color: '#6b7280',
  lineHeight: '1.4'
};

const selectedServiceItem = {
  padding: '8px 0',
  borderBottom: '1px solid #e5e7eb',
  color: '#374151'
};

const selectedSubServicesList = {
  marginTop: 4,
  marginLeft: 16
};

const selectedSubServiceItem = {
  fontSize: '13px',
  color: '#6b7280',
  marginBottom: 2
};

const cardSurface = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
};

const btnPrimary = {
  padding: '10px 16px',
  background: '#1e40af',
  color: '#ffffff',
  border: 0,
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: '500'
};

const btnSecondary = {
  padding: '10px 16px',
  background: '#6b7280',
  color: '#ffffff',
  border: 0,
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: '500'
};




