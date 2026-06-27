"""Initial migration - create tables

Revision ID: 001_initial
Revises: 
Create Date: 2026-06-27 13:05:52.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector


# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable pgvector extension
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')
    
    # Create clinics table
    op.create_table(
        'clinics',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('address', sa.String(), nullable=False),
        sa.Column('city', sa.String(), nullable=False, server_default='Шымкент'),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lng', sa.Float(), nullable=False),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('website', sa.String(), nullable=True),
        sa.Column('rating', sa.Float(), nullable=False, server_default='0'),
        sa.Column('review_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('work_hours', sa.String(), nullable=True),
        sa.Column('logo_url', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_clinics_name', 'clinics', ['name'])
    op.create_index('ix_clinics_city', 'clinics', ['city'])
    
    # Create canonical_services table
    op.create_table(
        'canonical_services',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('normalized_title', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('parameters', sa.Text(), nullable=True),
        sa.Column('embedding', Vector(384), nullable=True),
        sa.Column('search_vector', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('title')
    )
    op.create_index('ix_canonical_services_title', 'canonical_services', ['title'])
    op.create_index('ix_canonical_services_normalized_title', 'canonical_services', ['normalized_title'])
    op.create_index('ix_canonical_services_category', 'canonical_services', ['category'])
    
    # Create services table
    op.create_table(
        'services',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('price', sa.Integer(), nullable=False),
        sa.Column('old_price', sa.Integer(), nullable=True),
        sa.Column('clinic_id', sa.String(), nullable=False),
        sa.Column('canonical_service_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['clinic_id'], ['clinics.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['canonical_service_id'], ['canonical_services.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_services_clinic_id', 'services', ['clinic_id'])
    op.create_index('ix_services_category', 'services', ['category'])
    op.create_index('ix_services_canonical_service_id', 'services', ['canonical_service_id'])
    op.create_index('idx_service_clinic_category', 'services', ['clinic_id', 'category'])
    op.create_index('idx_service_canonical', 'services', ['canonical_service_id'])
    
    # Create price_history table
    op.create_table(
        'price_history',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('service_id', sa.String(), nullable=False),
        sa.Column('price', sa.Integer(), nullable=False),
        sa.Column('old_price', sa.Integer(), nullable=True),
        sa.Column('recorded_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['service_id'], ['services.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_price_history_service_id', 'price_history', ['service_id'])
    op.create_index('ix_price_history_recorded_at', 'price_history', ['recorded_at'])
    op.create_index('idx_price_history_service_date', 'price_history', ['service_id', 'recorded_at'])


def downgrade() -> None:
    op.drop_table('price_history')
    op.drop_table('services')
    op.drop_table('canonical_services')
    op.drop_table('clinics')
    op.execute('DROP EXTENSION IF EXISTS vector')
