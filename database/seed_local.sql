-- Local development seed data. Run manually against an empty local database.
BEGIN;

INSERT INTO clients (client_code, client_name, is_active, ntn, client_type, payment_method) VALUES
  ('CL-001', 'Khaas Restaurant (Pvt.) Ltd.', 1, 'NTN-7894561-2', 1, 0),
  ('CL-002', 'Lahore Grill House', 1, NULL, 0, 1),
  ('CL-003', 'Spice Route Restaurants', 1, 'NTN-4567891-0', 1, 0),
  ('CL-004', 'Khyber Tikka House', 1, NULL, 0, 1),
  ('CL-005', 'Punjab Catering Services', 1, 'NTN-2345678-9', 1, 0);

INSERT INTO branches (client_id, branch_name, branch_code, area, address, contact_person, is_active) VALUES
  ((SELECT id FROM clients WHERE client_code = 'CL-001'), 'Gulberg Main Branch', 'CL-001-BR-001', 'Gulberg III', 'https://www.google.com/maps/search/?api=1&query=MM+Alam+Road+Gulberg+III+Lahore', $$[{"name":"Usman Khan","phone":"03001234567"}]$$::jsonb, 1),
  ((SELECT id FROM clients WHERE client_code = 'CL-001'), 'DHA Phase 6 Branch', 'CL-001-BR-002', 'DHA Phase 6', 'https://www.google.com/maps/search/?api=1&query=Main+Boulevard+DHA+Phase+6+Lahore', $$[{"name":"Hassan Raza","phone":"03014567890"}]$$::jsonb, 1),
  ((SELECT id FROM clients WHERE client_code = 'CL-002'), 'Johar Town Branch', 'CL-002-BR-001', 'Johar Town', 'https://www.google.com/maps/search/?api=1&query=Khayaban-e-Firdousi+Johar+Town+Lahore', $$[{"name":"Adeel Mahmood","phone":"03211234567"}]$$::jsonb, 1),
  ((SELECT id FROM clients WHERE client_code = 'CL-003'), 'Wapda Town Branch', 'CL-003-BR-001', 'Wapda Town', 'https://www.google.com/maps/search/?api=1&query=Khayaban-e-Jinnah+Wapda+Town+Lahore', $$[{"name":"Saad Ahmed","phone":"03331234567"}]$$::jsonb, 1),
  ((SELECT id FROM clients WHERE client_code = 'CL-003'), 'Model Town Branch', 'CL-003-BR-002', 'Model Town', 'https://www.google.com/maps/search/?api=1&query=Bank+Square+Market+Model+Town+Lahore', $$[{"name":"Fahad Iqbal","phone":"03027654321"}]$$::jsonb, 1),
  ((SELECT id FROM clients WHERE client_code = 'CL-004'), 'Fateh Garh Branch', 'CL-004-BR-001', 'Fateh Garh', 'https://www.google.com/maps/search/?api=1&query=Fateh+Garh+Lahore', $$[{"name":"Naveed Akram","phone":"03111239876"}]$$::jsonb, 1),
  ((SELECT id FROM clients WHERE client_code = 'CL-005'), 'Canal Road Kitchen', 'CL-005-BR-001', 'Canal Road', 'https://www.google.com/maps/search/?api=1&query=Canal+Road+Lahore', $$[{"name":"Mariam Sheikh","phone":"03451239876"}]$$::jsonb, 1),
  ((SELECT id FROM clients WHERE client_code = 'CL-005'), 'Airport Road Kitchen', 'CL-005-BR-002', 'Airport Road', 'https://www.google.com/maps/search/?api=1&query=Airport+Road+Lahore', $$[{"name":"Hamza Ali","phone":"03098765432"}]$$::jsonb, 0);

INSERT INTO users (username, password, account_type, is_active) VALUES
  ('sara.sales', '$2b$12$mXIbfy1CmVrPANQTMQ/57.5TTFM6DHwDE9AsEc2ukzE2ibRq.SqBW', 'employee', 1),
  ('ali.driver', '$2b$12$mXIbfy1CmVrPANQTMQ/57.5TTFM6DHwDE9AsEc2ukzE2ibRq.SqBW', 'employee', 1),
  ('bilal.driver', '$2b$12$mXIbfy1CmVrPANQTMQ/57.5TTFM6DHwDE9AsEc2ukzE2ibRq.SqBW', 'employee', 1);

INSERT INTO employees (user_id, full_name, father_name, address, start_date, monthly_salary, status, role, is_authenticated) VALUES
  (NULL, 'Imran Bashir', 'Muhammad Bashir', 'Township, Lahore', '2024-02-01', 65000, 1, 'warehouse_manager', 0),
  ((SELECT id FROM users WHERE username = 'sara.sales'), 'Sara Ahmed', 'Tariq Ahmed', 'Faisal Town, Lahore', '2024-04-15', 70000, 1, 'sales_manager', 1),
  ((SELECT id FROM users WHERE username = 'ali.driver'), 'Ali Raza', 'Ghulam Rasool', 'Green Town, Lahore', '2023-09-01', 52000, 1, 'driver', 1),
  ((SELECT id FROM users WHERE username = 'bilal.driver'), 'Bilal Ahmad', 'Muhammad Akram', 'Kot Lakhpat, Lahore', '2024-01-10', 50000, 1, 'driver', 1);

COMMIT;
