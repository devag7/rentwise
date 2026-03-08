require('dotenv').config({ path: './.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// We need an existing user ID to assign as the landlord
const LANDLORD_ID = "00000000-0000-0000-0000-000000000000"; // We'll fetch a real one dynamically

const MOCK_PROPERTIES = [
    {
        area_id: 1, // Indiranagar
        property_type: '2BHK',
        rent: 45000,
        size: 1200,
        address: '100ft Road Luxury Apartment, Indiranagar Stage 2',
        preferences: 'Family Preferred, Vegetarian',
        google_maps_link: 'https://maps.google.com/?q=12.9784,77.6408',
        image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'
    },
    {
        area_id: 2, // Koramangala
        property_type: '3BHK',
        rent: 85000,
        size: 2100,
        address: 'Sony World Junction Penthouse, Koramangala Block 4',
        preferences: 'Company Lease Only',
        google_maps_link: 'https://maps.google.com/?q=12.9352,77.6245',
        image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80'
    },
    {
        area_id: 3, // Whitefield
        property_type: '1BHK',
        rent: 22000,
        size: 650,
        address: 'ITPB Tech Park Studio, Whitefield Main Road',
        preferences: 'Bachelors Allowed',
        google_maps_link: 'https://maps.google.com/?q=12.9698,77.7499',
        image_url: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80'
    },
    {
        area_id: 4, // HSR Layout
        property_type: '2BHK',
        rent: 38000,
        size: 1100,
        address: 'Sector 2 Minimalist Flat, Near BDA Complex',
        preferences: 'Any',
        google_maps_link: 'https://maps.google.com/?q=12.9081,77.6476',
        image_url: 'https://images.unsplash.com/photo-1502672260266-1c1de2d9d146?w=800&q=80'
    },
    {
        area_id: 1, // Indiranagar
        property_type: '3BHK',
        rent: 110000,
        size: 2500,
        address: 'Defence Colony Private Villa',
        preferences: 'Family Only, No Pets',
        google_maps_link: 'https://maps.google.com/?q=12.9716,77.6411',
        image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80'
    },
    {
        area_id: 5, // Marathahalli
        property_type: '1RK',
        rent: 15000,
        size: 400,
        address: 'Kundanahalli Gate Executive RK',
        preferences: 'Single Working Professional',
        google_maps_link: 'https://maps.google.com/?q=12.9569,77.7011',
        image_url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80'
    },
    {
        area_id: 6, // Bellandur
        property_type: '2BHK',
        rent: 42000,
        size: 1400,
        address: 'Outer Ring Road High-Rise, Near Eco Space',
        preferences: 'Any',
        google_maps_link: 'https://maps.google.com/?q=12.9304,77.6784',
        image_url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80'
    },
    {
        area_id: 7, // Jayanagar
        property_type: '3BHK',
        rent: 65000,
        size: 1800,
        address: '4th Block Heritage Condo, Near Ashoka Pillar',
        preferences: 'Family Only, Vegetarian',
        google_maps_link: 'https://maps.google.com/?q=12.9299,77.5826',
        image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80'
    },
];

async function imageToBase64(url) {
    try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        return Buffer.from(buffer).toString('base64');
    } catch (err) {
        console.error(`Failed to fetch image: ${url}`, err);
        return null;
    }
}

async function seed() {
    console.log("Starting DB Seed...");

    // 1. Get a Landlord User ID (We will just pick the first user in auth.users via RPC or standard query if possible, otherwise we'll try to create a dummy user)
    // Since we might not have admin rights via Anon key, let's just query the properties table to see if an ID exists, or we might need to insert without one if RLS allows.
    // Assuming RLS on properties allows inserts for now if service role is used... wait, if it's anon key, RLS will block us unless we log in.

    // Let's sign in a test user to perform the insert, or disable it.
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@rentwise.com', // Change this in terminal prior to running or we'll register one
        password: 'password123'
    });

    let activeUserId = null;

    if (authError) {
        console.log("Could not log in as admin. Attempting to register admin@rentwise.com...");
        const { data: regData, error: regErr } = await supabase.auth.signUp({
            email: 'admin@rentwise.com',
            password: 'password123',
            options: {
                data: { role: 'landlord', name: 'Admin Landlord' }
            }
        });
        if (regErr) {
            console.error("Failed to register dummy landlord. Run this script with correct credentials.", regErr);
            process.exit(1);
        }
        activeUserId = regData?.user?.id;
    } else {
        activeUserId = user?.id;
    }

    if (!activeUserId) {
        console.error("Could not obtain a valid authenticated user ID for the landlord.");
        process.exit(1);
    }

    console.log(`Using Landlord ID: ${activeUserId}`);

    // Fetch images and insert
    for (let i = 0; i < MOCK_PROPERTIES.length; i++) {
        const prop = MOCK_PROPERTIES[i];
        console.log(`Processing ${prop.address}...`);

        const base64Image = await imageToBase64(prop.image_url);

        if (!base64Image) {
            console.log(`Skipping ${prop.address} due to image fetch failure.`);
            continue;
        }

        const { error } = await supabase
            .from('properties')
            .insert({
                landlord_id: activeUserId,
                area_id: prop.area_id,
                property_type: prop.property_type,
                rent: prop.rent,
                size: prop.size,
                address: prop.address,
                preferences: prop.preferences,
                google_maps_link: prop.google_maps_link,
                image_data: base64Image // Storing as base64 per previous architecture requirements
            });

        if (error) {
            console.error(`Error inserting ${prop.address}:`, error.message);
        } else {
            console.log(`Successfully inserted: ${prop.address}`);
        }
    }

    console.log("Seeding complete!");
}

seed();
