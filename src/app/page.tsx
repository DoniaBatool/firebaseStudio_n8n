"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateExcuse, type GenerateExcuseInput } from "@/ai/flows/generate-excuse";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Copy, AlertCircle } from "lucide-react";

const formSchema = z.object({
  context: z.string().min(10, {
    message: "Please provide a bit more context (at least 10 characters).",
  }).max(500, {
    message: "Context cannot exceed 500 characters.",
  }),
});

type FormData = z.infer<typeof formSchema>;

export default function ExcuseGeneratorPage() {
  const [generatedExcuse, setGeneratedExcuse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      context: "",
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (values) => {
    setIsLoading(true);
    setGeneratedExcuse(null);
    setError(null);

    try {
      const aiInput: GenerateExcuseInput = { context: values.context };
      const aiResponse = await generateExcuse(aiInput);

      if (aiResponse && aiResponse.excuse) {
        setGeneratedExcuse(aiResponse.excuse);
        toast({
          title: "Excuse Generated!",
          description: "Your custom excuse is ready.",
        });

        // Make the POST request to the webhook
        try {
          const webhookResponse = await fetch('http://localhost:5678/webhook-test/a63df51a-7c0f-4221-bae9-1365f4693862', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ context: values.context }),
          });

          if (!webhookResponse.ok) {
            console.error('Webhook POST request failed:', webhookResponse.statusText);
            // Optionally notify user, though not strictly required by prompt
             toast({
              title: "Webhook Update",
              description: `Context sent to webhook, but server responded with ${webhookResponse.status}.`,
              variant: "default",
            });
          } else {
            toast({
              title: "Webhook Update",
              description: "Context successfully sent to webhook.",
            });
          }
        } catch (webhookError) {
          console.error('Error sending POST request to webhook:', webhookError);
           toast({
            title: "Webhook Error",
            description: "Could not send context to webhook. Check console.",
            variant: "destructive",
          });
        }

      } else {
        setError("The AI couldn't come up with an excuse this time. Try rephrasing your context.");
      }
    } catch (e) {
      console.error(e);
      setError("An unexpected error occurred while generating the excuse. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedExcuse) {
      navigator.clipboard.writeText(generatedExcuse)
        .then(() => {
          toast({
            title: "Copied!",
            description: "Excuse copied to clipboard.",
          });
        })
        .catch(err => {
          console.error("Failed to copy: ", err);
          toast({
            title: "Copy Failed",
            description: "Could not copy excuse to clipboard.",
            variant: "destructive",
          });
        });
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background selection:bg-primary/20 selection:text-primary">
      <Card className="w-full max-w-2xl shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="bg-card border-b border-border p-6">
          <CardTitle className="text-3xl font-headline flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Excuse Generator 2025
          </CardTitle>
          <CardDescription className="text-muted-foreground pt-1">
            Enter a situation, and we'll craft the perfect excuse for you!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="context"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="context-input" className="text-lg font-medium">Your Situation</FormLabel>
                    <FormControl>
                      <Textarea
                        id="context-input"
                        placeholder="e.g., I need an excuse for being late to a meeting..."
                        className="min-h-[120px] resize-none focus:ring-2 focus:ring-primary"
                        {...field}
                        aria-label="Situation context for excuse generation"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6 rounded-lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Excuse
                  </>
                )}
              </Button>
            </form>
          </Form>

          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {generatedExcuse && (
            <div className="mt-8 p-6 border border-border rounded-lg bg-secondary/30 shadow-inner space-y-4">
              <h3 className="text-xl font-headline text-primary">Your Custom Excuse:</h3>
              <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{generatedExcuse}</p>
              <Button onClick={handleCopy} variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground mt-4 py-3 rounded-lg">
                <Copy className="mr-2 h-4 w-4" />
                Copy Excuse
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
                Remember to use your newfound powers responsibly!
            </p>
        </CardFooter>
      </Card>
    </main>
  );
}
