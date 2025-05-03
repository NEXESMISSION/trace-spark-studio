import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with your credentials
const supabaseUrl = 'https://aauuecbslidjegrbgkid.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdXVlY2JzbGlkamVncmJna2lkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjAxOTI2NSwiZXhwIjoyMDYxNTk1MjY1fQ.kbWYrelpxXM12IiLl90Y1TY6Yxf6JTfVA8mv0u6NMXk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  try {
    // Use PostgreSQL's information_schema to get table information
    const { data, error } = await supabase
      .rpc('list_tables');

    if (error) {
      console.error('Error fetching tables:', error);
      console.log('Creating the list_tables function in Supabase...');
      await createListTablesFunction();
      return [];
    }

    console.log('Current tables in the database:');
    data.forEach((table, index) => {
      console.log(`${index + 1}. ${table}`);
    });

    return data;
  } catch (err) {
    console.error('Unexpected error:', err);
    return [];
  }
}

async function createListTablesFunction() {
  try {
    // Create a PostgreSQL function to list tables
    const { error } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION list_tables()
        RETURNS SETOF text AS $$
        BEGIN
          RETURN QUERY SELECT table_name::text 
          FROM information_schema.tables 
          WHERE table_schema = 'public';
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (error) {
      console.error('Error creating list_tables function:', error);
      console.log('You may need to create this function manually in the Supabase SQL editor:');
      console.log(`
        CREATE OR REPLACE FUNCTION list_tables()
        RETURNS SETOF text AS $$
        BEGIN
          RETURN QUERY SELECT table_name::text 
          FROM information_schema.tables 
          WHERE table_schema = 'public';
        END;
        $$ LANGUAGE plpgsql;
      `);
      return false;
    }

    console.log('Successfully created list_tables function');
    return true;
  } catch (err) {
    console.error('Unexpected error creating function:', err);
    return false;
  }
}

async function createExecuteSqlFunction() {
  try {
    // Create a PostgreSQL function to execute arbitrary SQL
    const { error } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION execute_sql(sql text)
        RETURNS void AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (error) {
      console.error('Error creating execute_sql function:', error);
      console.log('You may need to create this function manually in the Supabase SQL editor:');
      console.log(`
        CREATE OR REPLACE FUNCTION execute_sql(sql text)
        RETURNS void AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$ LANGUAGE plpgsql;
      `);
      return false;
    }

    console.log('Successfully created execute_sql function');
    return true;
  } catch (err) {
    console.error('Unexpected error creating function:', err);
    return false;
  }
}

async function dropTable(tableName) {
  try {
    // Execute SQL to drop the table
    const { error } = await supabase.rpc('execute_sql', {
      sql: `DROP TABLE IF EXISTS "${tableName}" CASCADE;`
    });

    if (error) {
      console.error(`Error dropping table ${tableName}:`, error);
      return false;
    }

    console.log(`Successfully dropped table: ${tableName}`);
    return true;
  } catch (err) {
    console.error(`Unexpected error dropping table ${tableName}:`, err);
    return false;
  }
}

async function main() {
  console.log('Setting up required functions...');
  await createExecuteSqlFunction();
  
  console.log('\nFetching tables...');
  const tables = await listTables();
  
  if (!tables || tables.length === 0) {
    console.log('No tables found or unable to retrieve tables.');
    console.log('Please visit the Supabase dashboard to manage tables manually:');
    console.log('https://app.supabase.com/project/aauuecbslidjegrbgkid/database/tables');
    return;
  }

  // Tables we want to keep for the simplified app (auth tables are automatically preserved)
  const essentialTables = ['users', 'sessions', 'profiles'];
  
  // Tables that can be safely removed based on our app simplification
  const tablesToRemove = tables.filter(tableName => {
    // Keep auth-related tables and essential tables
    return !tableName.startsWith('auth_') && 
           !essentialTables.includes(tableName) &&
           !tableName.includes('_migrations') &&
           tableName !== 'storage' &&
           !tableName.startsWith('_');
  });

  console.log('\nTables that can be safely removed:');
  if (tablesToRemove.length === 0) {
    console.log('No tables need to be removed.');
    return;
  }
  
  tablesToRemove.forEach((tableName, index) => {
    console.log(`${index + 1}. ${tableName}`);
  });

  console.log('\nTo remove these tables:');
  console.log('1. Go to the Supabase SQL Editor: https://app.supabase.com/project/aauuecbslidjegrbgkid/sql');
  console.log('2. Run the following SQL commands:');
  
  tablesToRemove.forEach(tableName => {
    console.log(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);
  });
  
  console.log('\nWarning: This will permanently delete these tables and all their data.');
  console.log('Make sure you have a backup if needed before proceeding.');
}

main();
