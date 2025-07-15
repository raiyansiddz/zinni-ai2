'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Check, X, Star, Crown } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState('free');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      planType: 'free',
      features: [
        'Custom Prompt',
        'Limited Pro Responses/day',
        'Limited Token Limit',
        'GPT-4-mini access',
        'AI Summary'
      ],
      limitations: [
        'Team-wide Knowledge',
        'Post-call Coaching',
        'Priority Support',
        'Centralized Billing',
        'Data Privacy'
      ],
      popular: false,
      icon: Check
    },
    {
      name: 'Pro',
      price: { monthly: 19.99, yearly: 199.99 },
      planType: 'pro',
      features: [
        'Custom Prompt',
        'Unlimited Pro Responses/day',
        'Unlimited Token Limit',
        'GPT-4.1 access',
        'AI Summary',
        'Priority Support'
      ],
      limitations: [
        'Team-wide Knowledge',
        'Post-call Coaching',
        'Centralized Billing',
        'Data Privacy'
      ],
      popular: true,
      icon: Star
    },
    {
      name: 'Enterprise',
      price: { monthly: 49.99, yearly: 499.99 },
      planType: 'enterprise',
      features: [
        'Custom Prompt',
        'Unlimited Pro Responses/day',
        'Unlimited Token Limit',
        'GPT-4.1 + Claude access',
        'AI Summary',
        'Team-wide Knowledge',
        'Post-call Coaching',
        'Priority Support',
        'Centralized Billing',
        'Data Privacy'
      ],
      limitations: [],
      popular: false,
      icon: Crown
    }
  ];

  const handleUpgrade = async (planType: string) => {
    setLoading(true);
    try {
      // TODO: Implement Stripe checkout
      console.log(`Upgrading to ${planType}`);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentPlan(planType);
    } catch (error) {
      console.error('Error upgrading plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const PlanCard = ({ plan, isCurrentPlan }) => (
    <div className={`bg-white rounded-xl shadow-sm border p-6 relative ${
      plan.popular ? 'ring-2 ring-blue-500' : ''
    } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}
      
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Current Plan
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
          <plan.icon className="h-6 w-6 text-gray-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <div className="mb-4">
          <span className="text-3xl font-bold text-gray-900">
            ${plan.price[billingCycle]}
          </span>
          <span className="text-gray-500 ml-2">
            /{billingCycle === 'yearly' ? 'year' : 'month'}
          </span>
        </div>
        
        {!isCurrentPlan && (
          <button
            onClick={() => handleUpgrade(plan.planType)}
            disabled={loading}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              plan.popular
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            } disabled:opacity-50`}
          >
            {loading ? 'Processing...' : 'Upgrade'}
          </button>
        )}
        
        {isCurrentPlan && (
          <div className="w-full py-2 px-4 rounded-lg bg-green-100 text-green-800 font-medium">
            Current Plan
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-center text-sm">
              <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
        
        {plan.limitations.length > 0 && (
          <div className="space-y-2">
            {plan.limitations.map((limitation, index) => (
              <div key={index} className="flex items-center text-sm">
                <X className="h-4 w-4 text-gray-300 mr-2 flex-shrink-0" />
                <span className="text-gray-400">{limitation}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600">Manage your subscription and billing preferences</p>
        </div>

        {/* Current Plan Summary */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
              <p className="text-gray-600">
                You're currently on the <span className="font-medium">{currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</span> plan
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                ${plans.find(p => p.planType === currentPlan)?.price[billingCycle] || 0}
              </p>
              <p className="text-sm text-gray-500">
                /{billingCycle === 'yearly' ? 'year' : 'month'}
              </p>
            </div>
          </div>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="text-center">
          <div className="inline-flex items-center bg-white rounded-lg p-1 shadow-sm border">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'yearly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Yearly
            </button>
          </div>
          {billingCycle === 'yearly' && (
            <p className="text-sm text-green-600 mt-2">Save up to 17% with yearly billing</p>
          )}
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan.planType}
              plan={plan}
              isCurrentPlan={currentPlan === plan.planType}
            />
          ))}
        </div>

        {/* Billing History */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h2>
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No billing history yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Your future invoices will appear here
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}