
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Crown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Subscription = () => {
  const [billingPeriod, setBillingPeriod] = React.useState<'monthly' | 'lifetime'>('monthly');
  const { toast } = useToast();
  
  // Mock subscription status - would come from backend in real app
  const isSubscribed = false;
  
  const plans = [
    {
      name: 'Free',
      description: 'Basic features to get you started',
      price: billingPeriod === 'monthly' ? '$0' : '$0',
      period: 'forever',
      features: [
        'Basic camera overlay',
        'Upload up to 5 reference images',
        'Basic overlay controls (opacity, scale)'
      ],
      limitations: [
        'No LiveView',
        'No AI assistant',
        'No 3D tilt controls'
      ]
    },
    {
      name: 'Premium',
      description: 'Full access to all TraceMate features',
      price: billingPeriod === 'monthly' ? '$9.99' : '$99.99',
      period: billingPeriod === 'monthly' ? 'per month' : 'one-time payment',
      features: [
        'All free features',
        'Unlimited reference images',
        'Advanced overlay controls',
        '3D tilt controls',
        'Cross-device LiveView sync',
        'Anna AI drawing assistant'
      ]
    }
  ];

  const handleSubscribe = (plan: string) => {
    if (plan === 'Free') {
      toast({ title: "Already on Free plan", description: "You're already using the Free plan." });
      return;
    }
    
    toast({
      title: "Feature Limited",
      description: "Subscription functionality requires Supabase integration.",
    });
  };
  
  return (
    <div className="container px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Subscription</h1>
      <p className="text-muted-foreground mb-8">Choose the plan that's right for you</p>
      
      <div className="flex flex-col items-center mb-8">
        <Tabs defaultValue="monthly" className="mb-8">
          <TabsList>
            <TabsTrigger 
              value="monthly" 
              onClick={() => setBillingPeriod('monthly')}
            >
              Monthly
            </TabsTrigger>
            <TabsTrigger 
              value="lifetime" 
              onClick={() => setBillingPeriod('lifetime')}
            >
              Lifetime
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        {billingPeriod === 'lifetime' && (
          <div className="bg-traceMate/10 text-traceMate text-sm p-2 px-3 rounded-md mb-6">
            Save 17% with lifetime access
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => {
          const isCurrent = (plan.name === 'Free' && !isSubscribed) || 
                            (plan.name === 'Premium' && isSubscribed);
          
          return (
            <Card 
              key={plan.name}
              className={`
                border 
                ${plan.name === 'Premium' 
                  ? 'border-traceMate shadow-lg relative overflow-hidden' 
                  : ''}
                ${isCurrent ? 'ring-2 ring-traceMate' : ''}
              `}
            >
              {plan.name === 'Premium' && (
                <div className="absolute top-0 right-0">
                  <div className="bg-traceMate text-primary-foreground text-xs font-medium px-4 py-1 rounded-bl-lg">
                    Recommended
                  </div>
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.name === 'Premium' && <Crown size={18} className="text-traceMate" />}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <div className="text-3xl font-bold">
                    {plan.price}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      {plan.period}
                    </span>
                  </div>
                </div>
                
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  
                  {plan.limitations && plan.limitations.map((limitation, index) => (
                    <li key={`limit-${index}`} className="flex items-center gap-2 text-muted-foreground">
                      <span className="w-[18px] h-[18px] flex items-center justify-center rounded-full border border-muted-foreground text-xs">
                        ×
                      </span>
                      <span>{limitation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button 
                  onClick={() => handleSubscribe(plan.name)}
                  className={`w-full ${plan.name === 'Premium' 
                    ? 'bg-traceMate hover:bg-traceMate-dark text-white'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                  variant={plan.name === 'Premium' ? 'default' : 'outline'}
                  disabled={isCurrent}
                >
                  {isCurrent ? 'Current Plan' : `Select ${plan.name}`}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      
      <div className="mt-12 max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">What's included in the Premium plan?</h3>
            <p className="text-muted-foreground">
              Premium includes unlimited reference images, advanced overlay controls including 3D tilt, 
              cross-device LiveView syncing, and access to Anna AI drawing assistant.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium">Can I cancel my subscription anytime?</h3>
            <p className="text-muted-foreground">
              Yes, you can cancel your monthly subscription at any time. You'll continue to have access until the end of your billing period.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium">What happens to my reference images if I downgrade?</h3>
            <p className="text-muted-foreground">
              If you downgrade from Premium to Free, you'll maintain access to all your existing images but will be limited to 5 new uploads.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium">Is there a trial period?</h3>
            <p className="text-muted-foreground">
              We don't currently offer a trial period, but our Free tier gives you access to core features so you can try before you upgrade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
