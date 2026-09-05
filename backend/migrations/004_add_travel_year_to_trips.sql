-- Migration: 004_add_travel_year_to_trips
-- Adds travel_year column to the trips table

ALTER TABLE trips
    ADD COLUMN IF NOT EXISTS travel_year INTEGER;
